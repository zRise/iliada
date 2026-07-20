const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// O plugin "stealth" disfarça várias características que entregam que é
// um Chrome automatizado (headless), o que ajuda a evitar bloqueios 403
// da Cloudflare em sites protegidos, como o Hylex Stats.
puppeteer.use(StealthPlugin());

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

/**
 * Faz uma única tentativa de navegar até o perfil e ler o HTML.
 * Pode lançar erro se a página navegar de novo no meio do processo
 * (ex: checagem da Cloudflare) — por isso essa função é chamada
 * dentro de um retry em fetchProfileHtml.
 */
async function attemptFetch(page, nick) {
  const url = `https://stats.hylex.gg/perfil/${encodeURIComponent(nick)}`;

  const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

  // Espera até o nickname aparecer de verdade na tela (ou até 25s).
  // Perfis novos (que o site ainda não tem em cache) demoram mais pra processar
  // do que perfis já pesquisados antes, então uma espera fixa curta não é confiável.
  await page
    .waitForSelector('h1.nickname-info-text', { timeout: 25000 })
    .catch(() => {
      // Não apareceu a tempo — pode ser jogador inexistente, ou só mais lento
      // que o esperado. Seguimos e deixamos o parser/scraper decidir o que fazer.
    });

  try {
    await page.waitForNetworkIdle({ idleTime: 1000, timeout: 15000 });
  } catch (e) {
    // Segue mesmo se não ficar 100% ocioso.
  }
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const html = await page.content();
  const status = response.status();

  // Se o nickname não aparecer, salvamos um "print" e o HTML pra debug,
  // em vez de simplesmente falhar sem explicação.
  const temNickNoHtml = html.includes('nickname-info-text');
  if (!temNickNoHtml) {
    const fs = require('fs');
    const path = require('path');
    const debugDir = path.join(__dirname, '..', 'debug');
    fs.mkdirSync(debugDir, { recursive: true });

    const nomeArquivo = nick.replace(/[^a-z0-9]/gi, '_');
    await page.screenshot({ path: path.join(debugDir, `${nomeArquivo}.png`) }).catch(() => {});
    fs.writeFileSync(path.join(debugDir, `${nomeArquivo}.html`), html, 'utf-8');
    console.warn(`⚠️ Nickname não encontrado no HTML. Debug salvo em debug/${nomeArquivo}.png e .html`);
  }

  return { html, status };
}

/**
 * Busca o HTML renderizado do perfil de um jogador no Hylex Stats,
 * tentando novamente automaticamente se a página navegar de novo
 * no meio do processo (erro "Execution context was destroyed").
 *
 * @param {string} nick - nickname do jogador
 * @param {number} maxAttempts - quantas vezes tentar antes de desistir
 * @returns {Promise<{html: string, status: number}>}
 */
async function fetchProfileHtml(nick, maxAttempts = 3) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(USER_AGENT);

    let lastError;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await attemptFetch(page, nick);
      } catch (err) {
        lastError = err;
        const isNavigationError =
          err.message.includes('Execution context was destroyed') ||
          err.message.includes('Target closed') ||
          err.message.includes('Navigation timeout');

        if (!isNavigationError || attempt === maxAttempts) {
          throw err;
        }

        console.warn(`⚠️ Tentativa ${attempt} falhou (${err.message}). Tentando de novo...`);
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    throw lastError;
  } finally {
    await browser.close();
  }
}

module.exports = { fetchProfileHtml };