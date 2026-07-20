require('dotenv').config();
const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');

const USERNAME = process.env.MC_USERNAME;
const PASSWORD = process.env.MC_PASSWORD;

// Coordenadas perto do holograma "PRESTÍGIO DE CLAN"
const DESTINO = { x: 4975, y: 53, z: 5030 };

/**
 * Remove os códigos de cor/formatação do Minecraft (ex: §e, §7, §r)
 * de um texto de holograma.
 */
function limparCodigosDeCor(texto) {
  return texto.replace(/§[0-9a-fk-or]/gi, '').trim();
}

/**
 * Tenta extrair {rank, tag, pontos} de uma linha de holograma de clã.
 * Formato esperado (depois de limpar as cores): "1º [ODY] - 545679"
 */
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

  // Remove duplicatas (caso a mesma entidade seja processada 2x) e ordena por rank
  const unicos = new Map();
  for (const item of resultados) {
    unicos.set(item.rank, item);
  }

  return [...unicos.values()].sort((a, b) => a.rank - b.rank);
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

      console.log(`🚶 Indo até o holograma...`);
      bot.pathfinder.setGoal(new goals.GoalNear(DESTINO.x, DESTINO.y, DESTINO.z, 2));
    }, 2000);
  }, 2000);
});

bot.on('goal_reached', () => {
  console.log('🎯 Chegou perto! Esperando o mundo carregar...');
  setTimeout(() => {
    const topClan = coletarTopClan();
    console.log('\n🏆 TOP CLÃ:\n');
    console.log(JSON.stringify(topClan, null, 2));
  }, 3000);
});

bot.on('kicked', (reason) => console.log('❌ Kickado:', reason));
bot.on('error', (err) => console.error('❌ Erro:', err.message));