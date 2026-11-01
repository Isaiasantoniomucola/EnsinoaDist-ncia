// Utilitários para rotas assíncronas, erros com código HTTP e validações comuns.
const crypto = require('crypto');

const h = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function erro(status, mensagem) {
  const e = new Error(mensagem);
  e.status = status;
  return e;
}

const texto = (v) => (typeof v === 'string' ? v.trim() : '');
const normalizarEmail = (v) => texto(v).toLowerCase();
const emailValido = (e) => e.length <= 160 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);

// forte = true (administradores): mínimo 10 caracteres, com maiúscula, minúscula e número.
// Alunos: mínimo 8 caracteres, com pelo menos uma letra e um número.
function validarSenha(senha, { forte = false } = {}) {
  if (typeof senha !== 'string') throw erro(400, 'Indique a palavra-passe.');
  const min = forte ? 10 : 8;
  if (senha.length < min) throw erro(400, `A palavra-passe deve ter pelo menos ${min} caracteres.`);
  if (senha.length > 72) throw erro(400, 'A palavra-passe não pode ter mais de 72 caracteres.');
  if (!/[A-Za-z]/.test(senha) || !/\d/.test(senha)) throw erro(400, 'A palavra-passe deve ter letras e números.');
  if (forte && (!/[a-z]/.test(senha) || !/[A-Z]/.test(senha))) throw erro(400, 'A palavra-passe de administrador deve ter maiúsculas e minúsculas.');
}

// Comparação em tempo constante (códigos e segredos).
function iguais(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

module.exports = { h, erro, texto, normalizarEmail, emailValido, validarSenha, iguais };
