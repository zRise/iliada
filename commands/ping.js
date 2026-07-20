const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Verifica se o bot está online e a latência.'),

  async execute(interaction) {
    const sent = await interaction.reply({ content: '🏓 Calculando ping...', fetchReply: true });
    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    const apiLatency = Math.round(interaction.client.ws.ping);

    await interaction.editReply(
      `🏓 Pong!\n📶 Latência do bot: **${latency}ms**\n🌐 Latência da API do Discord: **${apiLatency}ms**`
    );
  },
};
