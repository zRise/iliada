/**
 * Script AVULSO só pra testar o envio da mensagem de marco uma única vez.
 * Rode manualmente com: node test-envio-marco.js
 * Não faz parte do bot normal e não roda sozinho.
 */
require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

const CANAL_ID = '1500710164859453530';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('clientReady', async () => {
  try {
    const canal = await client.channels.fetch(CANAL_ID);
    await canal.send('🎉 **[ODY]** acabou de bater **500.000** de Prestígio de Clã! 🏆👑');
    console.log('✅ Mensagem de teste enviada!');
  } catch (err) {
    console.error('❌ Erro ao enviar:', err.message);
  } finally {
    client.destroy();
    process.exit(0);
  }
});

client.login(process.env.DISCORD_TOKEN);