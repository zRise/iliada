require('dotenv').config();
const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');

const USERNAME = process.env.MC_USERNAME;
const PASSWORD = process.env.MC_PASSWORD;

// Coordenadas perto do holograma "PRESTÍGIO DE CLAN", pegas com F3
const DESTINO = { x: 4975, y: 53, z: 5030 };

const bot = mineflayer.createBot({
  host: 'hylex.gg',
  port: 25565,
  username: USERNAME,
  auth: 'offline',
  version: '1.8.9',
});

bot.loadPlugin(pathfinder);

function dumpArmorStands() {
  const entidades = Object.values(bot.entities);
  console.log(`\n🔎 Total de entidades visíveis: ${entidades.length}`);

  const tiposUnicos = new Set(entidades.map((e) => `${e.type || '?'} / ${e.name || e.mobType || e.kind || '?'}`));
  console.log('📋 Tipos de entidade únicos vistos:', [...tiposUnicos]);

  for (const e of entidades) {
    const nome = e.customName || e.username;
    const pareceArmorStand =
      (e.name && e.name.toLowerCase().includes('armor')) ||
      (e.kind && e.kind.toLowerCase().includes('armor'));

    if (nome || pareceArmorStand) {
      console.log('\n--- Entidade interessante ---');
      console.log('type:', e.type, '| name:', e.name, '| kind:', e.kind);
      console.log('Posição:', e.position);
      console.log('customName:', nome);
      console.log('metadata bruto:', JSON.stringify(e.metadata));
    }
  }
}

bot.once('spawn', () => {
  console.log(`✅ Bot entrou. Posição: ${JSON.stringify(bot.entity.position)}`);

  setTimeout(() => {
    bot.chat(`/login ${PASSWORD}`);

    setTimeout(() => {
      const mcData = require('minecraft-data')(bot.version);
      const movements = new Movements(bot, mcData);
      bot.pathfinder.setMovements(movements);

      console.log(`🚶 Indo até o holograma em ${JSON.stringify(DESTINO)}...`);
      bot.pathfinder.setGoal(new goals.GoalNear(DESTINO.x, DESTINO.y, DESTINO.z, 2));
    }, 2000);
  }, 2000);
});

bot.on('goal_reached', () => {
  console.log('🎯 Chegou perto do destino! Esperando o mundo carregar...');
  setTimeout(dumpArmorStands, 3000);
});

bot.on('path_update', (r) => {
  if (r.status === 'noPath') {
    console.log('❌ Não encontrei um caminho até o destino.');
  }
});

bot.on('kicked', (reason) => console.log('❌ Kickado:', reason));
bot.on('error', (err) => console.error('❌ Erro:', err.message));