const cheerio = require('cheerio');

/**
 * Extrai um número de uma string, removendo pontos de milhar e trocando
 * vírgula decimal por ponto. Ex: "13.039" -> 13039 | "1,28" -> 1.28
 * Se não for possível converter (ex: "??", "-", vazio), retorna o texto original.
 */
function parseNumber(text) {
  if (!text) return null;
  const clean = text.replace(/%/g, '').trim();

  // Formato "13.039" (milhar) vira 13039; "1.28" (decimal) fica 1.28.
  // Regra simples: se tiver só 1 ponto e 2 casas depois, tratamos como decimal.
  const isDecimal = /^\d+\.\d{1,2}$/.test(clean) && !clean.includes(',');
  if (isDecimal) return parseFloat(clean);

  const onlyDigits = clean.replace(/\./g, '').replace(',', '.');
  const num = parseFloat(onlyDigits);
  return isNaN(num) ? text.trim() : num;
}

/**
 * Extrai as informações básicas do perfil (nick, grupo, status, etc.)
 */
function parseBasicInfo($) {
  const nick = $('h1.nickname-info-text').first().text().trim() || null;
  const grupo = $('span.main-group-label').first().text().trim() || null;
  const banido = $('h1.ban-punish-text').length > 0
    ? $('h1.ban-punish-text').first().text().trim()
    : null;
  const statusOnline = $('div.online-status-tooltip').first().text().trim() || null;

  const timeItems = $('span.time-account-info-item')
    .map((_, el) => $(el).text().trim())
    .get();

  // Cada item vem como "Rótulo: valor" (ex: "Primeiro login: 22/02/2023").
  // Aqui separamos e guardamos só o valor.
  const extractValue = (fullText) => {
    if (!fullText) return null;
    const parts = fullText.split(':');
    return parts.length > 1 ? parts.slice(1).join(':').trim() : fullText.trim();
  };

  const amigosText = $('span.friends-counter-item').first().text().trim();
  const amigosMatch = amigosText.match(/(\d+)/);
  const amigos = amigosMatch ? parseInt(amigosMatch[1], 10) : null;

  return {
    nick,
    grupo,
    banido,
    statusOnline: extractValue(statusOnline),
    primeiroLogin: extractValue(timeItems[0]),
    ultimoLogin: extractValue(timeItems[1]),
    tempoOnline: extractValue(timeItems[2]),
    amigos,
  };
}

/**
 * Extrai os cards "Total" de cada modo de jogo (Bedwars, Skywars, etc.)
 * Retorna um objeto tipo:
 * {
 *   bedwars: { titulo: "Bedwars", subtitulo: "Total", stats: { "Vitórias": 770, ... } },
 *   duels: { ... },
 *   ...
 * }
 */
function parseGameModes($) {
  const modes = {};

  $('div.personalstats-card').each((_, card) => {
    const $card = $(card);

    const titleContainer = $card.find('div.personalstats-card-title-container').first();
    if (titleContainer.length === 0) return;

    // A classe do container tem 2 tokens: "personalstats-card-title-container" e o nome do modo (ex: "bedwars")
    const classTokens = (titleContainer.attr('class') || '').split(/\s+/);
    const modeKey = classTokens.find((c) => c !== 'personalstats-card-title-container');
    if (!modeKey) return;

    const titulo = titleContainer.find('h1.personalstats-card-title').first().text().trim();
    const subtitulo = $card.find('p.personalstats-card-subtitle').first().text().trim();

    const stats = {};
    $card.find('div.personalstats-card-content-item').each((_, item) => {
      const $item = $(item);
      const label = $item.find('h1.personalstats-card-content-title').first().text().trim();
      const valueText = $item.find('p.personalstats-card-content-value').first().text().trim();

      if (label) {
        stats[label] = parseNumber(valueText);
      }
    });

    modes[modeKey] = { titulo, subtitulo, stats };
  });

  return modes;
}

/**
 * Função principal: recebe o HTML completo da página de perfil e retorna
 * um objeto JSON estruturado com todas as informações.
 */
function parseProfile(html) {
  const $ = cheerio.load(html);

  const basicInfo = parseBasicInfo($);
  const modes = parseGameModes($);

  return {
    ...basicInfo,
    modos: modes,
  };
}

module.exports = { parseProfile, parseNumber };