const fs = require('fs');
const path = require('path');
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const ARQUIVO_DADOS = path.join(__dirname, '..', 'data', 'topclan.json');

// Se os dados forem mais antigos que isso, avisamos que podem estar desatualizados
const LIMITE_DADOS_ANTIGOS_MS = 20 * 60 * 1000; // 20 minutos

const MEDALHAS = { 1: '🥇', 2: '🥈', 3: '🥉' };

module.exports = {
  data: new SlashCommandBuilder()
    .setName('topclan')
    .setDescription('Mostra o ranking de Prestígio de Clã do Hylex'),

  async execute(interaction) {
    if (!fs.existsSync(ARQUIVO_DADOS)) {
      await interaction.reply(
        '❌ Ainda não tenho dados do Top Clã. O bot Minecraft pode não estar conectado no momento.'
      );
      return;
    }

    const conteudo = JSON.parse(fs.readFileSync(ARQUIVO_DADOS, 'utf-8'));
    const { atualizadoEm, clans } = conteudo;

    if (!clans || clans.length === 0) {
      await interaction.reply('❌ O arquivo de dados está vazio. Tente novamente mais tarde.');
      return;
    }

    const dataAtualizacao = new Date(atualizadoEm);
    const idadeDadosMs = Date.now() - dataAtualizacao.getTime();
    const dadosDesatualizados = idadeDadosMs > LIMITE_DADOS_ANTIGOS_MS;

    const linhas = clans.map((clan) => {
      const medalha = MEDALHAS[clan.rank] || `${clan.rank}º`;
      const pontosFormatados = clan.pontos.toLocaleString('pt-BR');
      return `${medalha} **[${clan.tag}]** — ${pontosFormatados} pontos`;
    });

    const embed = new EmbedBuilder()
      .setTitle('🏆 TOP CLÃS — Hylex')
      .setColor(0xffd700)
      .setDescription(linhas.join('\n'))
      .setFooter({
        text: dadosDesatualizados
          ? `⚠️ Dados podem estar desatualizados — última atualização: ${dataAtualizacao.toLocaleString('pt-BR')}`
          : `Atualizado em: ${dataAtualizacao.toLocaleString('pt-BR')}`,
      });

    await interaction.reply({ embeds: [embed] });
  },
};