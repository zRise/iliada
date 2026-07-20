require('dotenv').config();
const mineflayer = require('mineflayer');

const USERNAME = process.env.MC_USERNAME;
const PASSWORD = process.env.MC_PASSWORD;

const bot = mineflayer.createBot({
  host: 'hylex.gg',
  port: 25565,
  username: USERNAME,
  auth: 'offline',
  version: '1.8.9',
});

function logEntitiesComNome() {
  const entidades = Object.values(bot.entities);
  console.log(`\n🔎 Total de entidades visíveis: ${entidades.length}`);

  let encontrouAlguma = false;

  for (const entity of entidades) {
    // Hologramas geralmente são Armor Stands com um "nome customizado" (customName)
    // que é o próprio texto do holograma.
    const nome = entity.customName || entity.username || null;

    if (nome) {
      encontrouAlguma = true;
      console.log(
        `📛 [${entity.type || entity.kind || '?'}] "${nome}" → posição: x=${entity.position.x.toFixed(2)}, y=${entity.position.y.toFixed(2)}, z=${entity.position.z.toFixed(2)}`
      );
    }
  }

  if (!encontrouAlguma) {
    console.log('❌ Nenhuma entidade com nome/texto encontrada por perto ainda.');
  }
}

bot.once('spawn', () => {
  console.log(`✅ Bot entrou. Posição: ${JSON.stringify(bot.entity.position)}`);

  setTimeout(() => {
    bot.chat(`/login ${PASSWORD}`);

    // Espera mais um pouco pro mundo carregar todas as entidades ao redor,
    // depois lista o que encontrou.
    setTimeout(logEntitiesComNome, 5000);
  }, 2000);
});

// Toda vez que uma entidade nova aparecer perto do bot, avisamos também
bot.on('entitySpawn', (entity) => {
  const nome = entity.customName || entity.username;
  if (nome) {
    console.log(`🆕 Nova entidade com nome: "${nome}" em ${JSON.stringify(entity.position)}`);
  }
});

bot.on('kicked', (reason) => console.log('❌ Kickado:', reason));
bot.on('error', (err) => console.error('❌ Erro:', err.message));