require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');

const USERNAME = process.env.MC_USERNAME;
const PASSWORD = process.env.MC_PASSWORD;

// Coordenadas perto do holograma "PRESTÍGIO DE CLAN"
const DESTINO = { x: 4975, y: 53, z: 5030 };

// Arquivo compartilhado com o bot Discord (fica na pasta data/ do projeto principal)
const ARQUIVO_SAIDA = path.join(__dirname, '..', 'data', 'topclan.json');

// A cada quantos minutos relemos o holograma e atualizamos o arquivo
const INTERVALO_ATUALIZACAO_MS = 5 * 60 * 1000; // 5 minutos

if (!USERNAME || !PASSWORD) {
  console.error('❌ Configure MC_USERNAME e MC_PASSWORD no arquivo .env antes de rodar.');
  process.exit(1);
}

function limparCodigosDeCor(texto) {
  return texto.replace(/§[0-9a-fk-or]/gi, '').trim();
}

function parseLinhaClan(textoLimpo) {
  const match = textoLimpo.match(/(\d+)º\s*\[([^\]]+)\]\s*-\s*([\d.]+)/);
  if (!match) return null;

  const [, rankStr, tag, pontosStr] = match;
  return {
    rank: parseInt(rankStr, 10),
    tag,
    pontos: parseInt(pontosStr.replace(/\./g, ''), 10),
  };
}

function coletarTopClan() {
  const entidades = Object.values(bot.entities);
  const resultados = [];

  for (const e of entidades) {
    if (e.name !== 'ArmorStand') continue;
    const textoRaw = e.metadata && e.metadata[2];
    if (typeof textoRaw !== 'string') continue;

    const textoLimpo = limparCodigosDeCor(textoRaw);
    const linha = parseLinhaClan(textoLimpo);
    if (linha) resultados.push(linha);
  }

  const unicos = new Map();
  for (const item of resultados) {
    unicos.set(item.rank, item);
  }

  return [...unicos.values()].sort((a, b) => a.rank - b.rank);
}

function salvarResultado(topClan) {
  const dados = {
    atualizadoEm: new Date().toISOString(),
    clans: topClan,
  };

  fs.mkdirSync(path.dirname(ARQUIVO_SAIDA), { recursive: true });
  fs.writeFileSync(ARQUIVO_SAIDA, JSON.stringify(dados, null, 2), 'utf-8');
  console.log(`💾 Top Clã salvo em ${ARQUIVO_SAIDA} (${topClan.length} clãs)`);
}

const bot = mineflayer.createBot({
  host: 'hylex.gg',
  port: 25565,
  username: USERNAME,
  auth: 'offline',
  version: '1.8.9',
});

bot.loadPlugin(pathfinder);

bot.once('spawn', () => {
  console.log(`✅ Bot entrou. Posição: ${JSON.stringify(bot.entity.position)}`);

  setTimeout(() => {
    bot.chat(`/login ${PASSWORD}`);

    setTimeout(() => {
      const mcData = require('minecraft-data')(bot.version);
      const movements = new Movements(bot, mcData);
      bot.pathfinder.setMovements(movements);

      console.log('🚶 Indo até o holograma do Top Clã...');
      bot.pathfinder.setGoal(new goals.GoalNear(DESTINO.x, DESTINO.y, DESTINO.z, 2));
    }, 2000);
  }, 2000);
});

bot.once('goal_reached', () => {
  console.log('🎯 Chegou perto do holograma. Vou ficar aqui coletando dados periodicamente.');

  // Primeira coleta, alguns segundos depois de chegar
  setTimeout(() => {
    salvarResultado(coletarTopClan());
  }, 3000);

  // Coletas seguintes, de tempos em tempos
  setInterval(() => {
    console.log('🔄 Atualizando dados do Top Clã...');
    const topClan = coletarTopClan();

    if (topClan.length === 0) {
      console.warn(
        '⚠️ A coleta veio vazia (0 clãs) — provavelmente o holograma estava sendo recriado ' +
        'pelo servidor nesse instante, ou o bot perdeu a visão da área momentaneamente. ' +
        'Mantendo os dados antigos no arquivo em vez de sobrescrever com vazio.'
      );
      return;
    }

    salvarResultado(topClan);
  }, INTERVALO_ATUALIZACAO_MS);

  // Rotina anti-AFK: pula e olha pra direções diferentes de tempos em tempos,
  // pra evitar que o servidor detecte o bot como parado/AFK e o kicke ou teleporte.
  setInterval(() => {
    // Olha pra uma direção (yaw) aleatória, com um pitch levemente aleatório também
    const yaw = Math.random() * Math.PI * 2;
    const pitch = (Math.random() - 0.5) * 0.5;
    bot.look(yaw, pitch, true);

    // Pequeno pulo
    bot.setControlState('jump', true);
    setTimeout(() => bot.setControlState('jump', false), 400);
  }, 30_000); // a cada 30 segundos
});

bot.on('kicked', (reason) => {
  console.log('❌ O bot foi kickado do servidor. Motivo:', reason);
});

bot.on('error', (err) => {
  console.error('❌ Erro de conexão:', err.message);
});

bot.on('end', () => {
  console.log('🔌 Conexão encerrada. (Considere reiniciar o processo automaticamente em produção)');
});