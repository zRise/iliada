const {
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const { getProfile } = require('../modules/scraper');
const { buildBasicEmbed, buildModeEmbed, buildModeOptions } = require('../embeds/profileEmbed');

const BACK_BUTTON_ID = 'perfil_voltar';
const SELECT_MENU_ID = 'perfil_modo_select';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('perfil')
    .setDescription('Mostra o perfil de estatísticas de um jogador no Hylex')
    .addStringOption((option) =>
      option.setName('nick').setDescription('Nickname do jogador').setRequired(true)
    ),

  async execute(interaction) {
    const nick = interaction.options.getString('nick');

    // A busca demora alguns segundos (o Puppeteer abre um navegador de verdade),
    // então avisamos o Discord que a resposta vai demorar um pouco.
    await interaction.deferReply();

    let profile;
    try {
      profile = await getProfile(nick);
    } catch (err) {
      await interaction.editReply(`❌ ${err.message}`);
      return;
    }

    const options = buildModeOptions(profile);

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(SELECT_MENU_ID)
      .setPlaceholder('Escolha um modo para ver as estatísticas')
      .addOptions(options);

    const selectRow = new ActionRowBuilder().addComponents(selectMenu);

    const backButton = new ButtonBuilder()
      .setCustomId(BACK_BUTTON_ID)
      .setLabel('Voltar ao perfil')
      .setEmoji('🔙')
      .setStyle(ButtonStyle.Secondary);

    const backRow = new ActionRowBuilder().addComponents(backButton);

    // Na tela básica, só o dropdown aparece. Na tela de um modo, o botão de voltar também aparece.
    const basicEmbed = buildBasicEmbed(profile);
    const reply = await interaction.editReply({
      embeds: [basicEmbed],
      components: [selectRow],
    });

    // Escuta cliques no menu e no botão, feitos apenas pela pessoa que usou o comando
    const collector = reply.createMessageComponentCollector({
      filter: (i) => i.user.id === interaction.user.id,
      time: 120_000, // 2 minutos
    });

    collector.on('collect', async (componentInteraction) => {
      if (componentInteraction.customId === SELECT_MENU_ID) {
        const modeKey = componentInteraction.values[0];
        const modeEmbed = buildModeEmbed(profile, modeKey);

        await componentInteraction.update({
          embeds: [modeEmbed],
          components: [selectRow, backRow],
        });
      } else if (componentInteraction.customId === BACK_BUTTON_ID) {
        await componentInteraction.update({
          embeds: [basicEmbed],
          components: [selectRow],
        });
      }
    });

    collector.on('end', async () => {
      // Depois do tempo limite, desabilita os componentes para evitar cliques "mortos"
      const disabledSelectRow = new ActionRowBuilder().addComponents(
        StringSelectMenuBuilder.from(selectMenu).setDisabled(true)
      );
      const disabledBackRow = new ActionRowBuilder().addComponents(
        ButtonBuilder.from(backButton).setDisabled(true)
      );
      try {
        await interaction.editReply({ components: [disabledSelectRow, disabledBackRow] });
      } catch (e) {
        // A mensagem pode já ter sido apagada; ignoramos o erro nesse caso.
      }
    });
  },
};