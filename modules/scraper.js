const { fetchProfileHtml } = require('./fetcher');
const { parseProfile } = require('./parser');

/**
 * Busca e extrai as informações de um perfil do Hylex Stats.
 *
 * @param {string} nick - nickname do jogador
 * @returns {Promise<object>} objeto com os dados do perfil
 * @throws {Error} se o jogador não for encontrado ou o site retornar erro
 */
async function getProfile(nick) {
  const { html, status } = await fetchProfileHtml(nick);

  if (status === 404) {
    throw new Error(`Jogador "${nick}" não encontrado.`);
  }
  if (status !== 200) {
    throw new Error(`O site retornou um status inesperado: ${status}`);
  }

  const profile = parseProfile(html);

  if (!profile.nick) {
    throw new Error(
      `Não encontrei dados para o jogador "${nick}". Verifique se o nick está certo, ` +
      `se as estatísticas dele são públicas, ou tente de novo em alguns segundos (perfis novos podem demorar mais pra carregar).`
    );
  }

  return profile;
}

module.exports = { getProfile };