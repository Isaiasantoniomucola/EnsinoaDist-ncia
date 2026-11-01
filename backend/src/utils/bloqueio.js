// Bloqueio temporário após várias tentativas falhadas (por IP + conta).
// Fica em memória: reinicia com o servidor. Para vários servidores use Redis.
const { erro } = require('./http');

const MAX_FALHAS = 5;
const BLOQUEIO_MS = 15 * 60 * 1000;
const registo = new Map();

const chave = (req, ...partes) => [req.ip, ...partes].join('|');

function verificar(k) {
  const r = registo.get(k);
  if (r && r.ate && r.ate > Date.now()) {
    const min = Math.ceil((r.ate - Date.now()) / 60000);
    throw erro(429, `Demasiadas tentativas falhadas. Tente novamente dentro de ${min} minuto(s).`);
  }
}

function falhou(k) {
  const r = registo.get(k) || { n: 0, ate: 0 };
  if (r.ate && r.ate <= Date.now()) { r.n = 0; r.ate = 0; }
  r.n += 1;
  if (r.n >= MAX_FALHAS) { r.ate = Date.now() + BLOQUEIO_MS; r.n = 0; }
  registo.set(k, r);
}

const sucesso = (k) => registo.delete(k);

// Limpeza periódica para não crescer sem limite.
setInterval(() => { const agora = Date.now(); for (const [k, r] of registo) if (!r.n && r.ate < agora) registo.delete(k); }, 10 * 60 * 1000).unref();

module.exports = { chave, verificar, falhou, sucesso };
