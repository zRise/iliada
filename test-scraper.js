/**
 * Teste isolado do scraper. Rode com:
 *   node test-scraper.js crdso
 */
const { getProfile } = require('./modules/scraper');

const nick = process.argv[2];
if (!nick) {
  console.error('Uso: node test-scraper.js <nick>');
  process.exit(1);
}

(async () => {
  console.log(`\n🔎 Buscando perfil de "${nick}"...\n`);
  try {
    const profile = await getProfile(nick);
    console.log(JSON.stringify(profile, null, 2));
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
})();
