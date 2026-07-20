const fs = require('fs');
const path = require('path');

const ARQUIVO_TOPCLAN = path.join(__dirname, '..', 'data', 'topclan.json');
const ARQUIVO_ESTADO = path.join(__dirname, '..', 'data', 'milestone-state.json');

const CANAL_ID = '1500710164859453530';
const TAG_CLAN_MONITORADO = 'ODY';
const PASSO_MARCA = 100_000; // notifica a cada 100k

function arredondarParaBaixo(pontos, passo) {
  return Math.floor(pontos / passo) * passo;
}

function lerEstado() {
  if (!fs.existsSync(ARQUIVO_ESTADO)) return {};
  try {
    return JSON.parse(fs.readFileSync(ARQUIVO_ESTADO, 'utf-8'));
  } catch (e) {
    return {};
  }
}

function salvarEstado(estado) {
  fs.mkdirSync(path.dirname(ARQUIVO_ESTADO), { recursive: true });
  fs.writeFileSync(ARQUIVO_ESTADO, JSON.stringify(estado, null, 2), 'utf-8');
}

/**
 * Confere se o clã monitorado cruzou uma nova marca de 100k desde a última
 * checagem, e se sim, manda uma mensagem no canal configurado.
 */
async function checarMarcos(client) {
  if (!fs.existsSync(ARQUIVO_TOPCLAN)) return;

  const { clans } = JSON.parse(fs.readFileSync(ARQUIVO_TOPCLAN, 'utf-8'));
  const clanAlvo = clans.find((c) => c.tag === TAG_CLAN_MONITORADO);
  if (!clanAlvo) return;

  const marcaAtual = arredondarParaBaixo(clanAlvo.pontos, PASSO_MARCA);
  const estado = lerEstado();
  const marcaAnterior = estado[TAG_CLAN_MONITORADO];

  // Primeira vez rodando: só grava a marca atual como referência, sem notificar
  // (evita notificar sobre marcos que o clã já tinha passado antes do bot existir).
  if (marcaAnterior === undefined) {
    estado[TAG_CLAN_MONITORADO] = marcaAtual;
    salvarEstado(estado);
    console.log(`ℹ️ Marco inicial de ${TAG_CLAN_MONITORADO} registrado: ${marcaAtual.toLocaleString('pt-BR')}`);
    return;
  }

  if (marcaAtual <= marcaAnterior) return; // ainda não cruzou uma marca nova

  try {
    const canal = await client.channels.fetch(CANAL_ID);

    // Notifica cada marco cruzado, caso tenha pulado mais de um de uma vez
    for (let marco = marcaAnterior + PASSO_MARCA; marco <= marcaAtual; marco += PASSO_MARCA) {
      const marcoFormatado = marco.toLocaleString('pt-BR');
      await canal.send(
        `🎉 **[${TAG_CLAN_MONITORADO}]** acabou de bater **${marcoFormatado}** de Prestígio de Clã! 🏆👑`
      );
      console.log(`✅ Notificação enviada: ${TAG_CLAN_MONITORADO} atingiu ${marcoFormatado}`);
    }
  } catch (err) {
    console.error('❌ Erro ao enviar notificação de marco:', err.message);
  }

  estado[TAG_CLAN_MONITORADO] = marcaAtual;
  salvarEstado(estado);
}

module.exports = { checarMarcos };