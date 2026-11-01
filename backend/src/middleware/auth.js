const jwt = require('jsonwebtoken');
const db = require('../config/db');

const ALG = ['HS256'];
const EMISSOR = 'ead-api';

// Os links de ficheiros (<video>, <iframe>, descarregamentos) não podem levar o cabeçalho
// Authorization. Em vez de pôr a sessão no URL, usa-se um "bilhete" curto, válido para uma
// só aula e um só utilizador, assinado com outra chave.
const segredoBilhete = () => `${process.env.JWT_SECRET}:ficheiro`;

const assinar = (payload, senhaHash, expiresIn) =>
  jwt.sign({ ...payload, sv: String(senhaHash || '').slice(-12) }, process.env.JWT_SECRET, { algorithm: 'HS256', expiresIn, issuer: EMISSOR });

function lerToken(req) {
  const cab = req.headers.authorization || '';
  return cab.startsWith('Bearer ') ? cab.slice(7) : null;
}

// Confirma na base de dados que a conta ainda existe, que o perfil não mudou e que a
// palavra-passe não foi alterada depois de a sessão ser emitida.
async function contaValida(dados) {
  const aluno = dados.tipo === 'aluno';
  const [l] = await db.query(
    aluno ? 'SELECT id, senha_hash FROM alunos WHERE id = ? LIMIT 1' : 'SELECT id, perfil, senha_hash FROM utilizadores WHERE id = ? LIMIT 1',
    [Number(dados.id) || 0]
  );
  const c = l[0];
  if (!c) return false;
  if (!aluno && c.perfil !== dados.tipo) return false;
  return String(c.senha_hash).slice(-12) === dados.sv;
}

// tipos: lista de perfis permitidos (null = qualquer sessão válida).
function autenticar(tipos = null) {
  return async (req, res, next) => {
    const token = lerToken(req);
    if (!token) return res.status(401).json({ erro: 'Sessão inválida. Inicie sessão novamente.' });
    let dados;
    try {
      dados = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ALG, issuer: EMISSOR });
    } catch {
      return res.status(401).json({ erro: 'Sessão expirada. Inicie sessão novamente.' });
    }
    try {
      if (!(await contaValida(dados))) return res.status(401).json({ erro: 'Sessão inválida. Inicie sessão novamente.' });
    } catch (e) { return next(e); }
    if (tipos && !tipos.includes(dados.tipo)) return res.status(403).json({ erro: 'Não tem permissão para esta operação.' });
    req.utilizador = dados;
    next();
  };
}

const emitirBilhete = (utilizador, aulaId) =>
  jwt.sign({ id: utilizador.id, tipo: utilizador.tipo, aula: Number(aulaId), uso: 'ficheiro' }, segredoBilhete(), { algorithm: 'HS256', expiresIn: '2h', issuer: EMISSOR });

function verificarBilhete(token, aulaId) {
  try {
    const d = jwt.verify(String(token || ''), segredoBilhete(), { algorithms: ALG, issuer: EMISSOR });
    return d.uso === 'ficheiro' && d.aula === Number(aulaId) ? d : null;
  } catch { return null; }
}

module.exports = { autenticar, assinar, emitirBilhete, verificarBilhete };
