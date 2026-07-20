const { EmbedBuilder } = require('discord.js');

const MODE_LABELS = {
  bedwars: { nome: 'Bedwars', emoji: '🛏' },
  skywars: { nome: 'Skywars', emoji: '☁' },
  bridge: { nome: 'The Bridge', emoji: '🌉' },
  blocksumo: { nome: 'Block Sumô', emoji: '🧱' },
  duels: { nome: 'Duels', emoji: '⚔' },
  buildbattle: { nome: 'BuildBattle', emoji: '🏗' },
};

const COR_PADRAO = 0x5865f2;
const COR_MODO = 0x57f287;

/**
 * Retorna a URL da cabeça (avatar) do jogador.
 * Jogadores "pirata" (nick terminado em "*") não têm skin registrada na Mojang,
 * então usamos a skin padrão do Steve nesses casos.
 */
function getSkinUrl(nick) {
  const isPirata = nick.trim().endsWith('*');
  if (isPirata) {
    return 'https://mc-heads.net/avatar/MHF_Steve/100';
  }
  return `https://mc-heads.net/avatar/${encodeURIComponent(nick)}/100`;
}

/**
 * Formata o status online/offline com emoji colorido
 */
function formatStatus(statusOnline) {
  if (!statusOnline) return '⚪ Desconhecido';
  const normalized = statusOnline.trim().toLowerCase();
  if (normalized === 'online') return '🟢 Online';
  if (normalized === 'offline') return '⚪ Offline';
  return `⚪ ${statusOnline}`;
}

/**
 * Embed principal: informações básicas do perfil (sem stats de modo específico)
 */
function buildBasicEmbed(profile) {
  const embed = new EmbedBuilder()
    .setTitle(`👤 ${profile.nick}`)
    .setColor(COR_PADRAO)
    .setThumbnail(getSkinUrl(profile.nick))
    .addFields(
      { name: '🏅 Grupo', value: profile.grupo || 'Nenhum', inline: true },
      { name: '📶 Status', value: formatStatus(profile.statusOnline), inline: true },
      { name: '👥 Amigos', value: String(profile.amigos ?? '—'), inline: true },
      { name: '⏱ Primeiro login', value: profile.primeiroLogin || '—', inline: true },
      { name: '⏱ Último login', value: profile.ultimoLogin || '—', inline: true },
      { name: '⏱ Tempo online', value: profile.tempoOnline || '—', inline: true }
    )
    .setFooter({ text: 'Selecione um modo abaixo para ver as estatísticas' });

  if (profile.banido) {
    embed.setDescription(`**🚫 ${profile.banido}**`);
  }

  return embed;
}

/**
 * Embed de um modo específico (Bedwars, Duels, etc.)
 */
function buildModeEmbed(profile, modeKey) {
  const modeData = profile.modos[modeKey];
  const label = MODE_LABELS[modeKey] || { nome: modeKey, emoji: '🎮' };

  const embed = new EmbedBuilder()
    .setTitle(`${label.emoji} ${profile.nick} — ${modeData.titulo} (${modeData.subtitulo})`)
    .setColor(COR_MODO)
    .setThumbnail(getSkinUrl(profile.nick));

  if (profile.banido) {
    embed.setDescription(`**🚫 ${profile.banido}**`);
  }

  const statEntries = Object.entries(modeData.stats);

  if (statEntries.length === 0) {
    embed.addFields({ name: '​', value: 'Nenhuma estatística disponível para este modo.' });
    return embed;
  }

  for (const [statLabel, value] of statEntries) {
    embed.addFields({ name: statLabel, value: String(value), inline: true });
  }

  return embed;
}

/**
 * Monta as opções do menu de seleção com base nos modos disponíveis no perfil
 */
function buildModeOptions(profile) {
  return Object.keys(profile.modos).map((modeKey) => {
    const label = MODE_LABELS[modeKey] || { nome: modeKey, emoji: '🎮' };
    return {
      label: label.nome,
      value: modeKey,
      emoji: label.emoji,
    };
  });
}

module.exports = { buildBasicEmbed, buildModeEmbed, buildModeOptions, MODE_LABELS, getSkinUrl };