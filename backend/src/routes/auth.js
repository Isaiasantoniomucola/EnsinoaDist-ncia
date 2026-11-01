const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const db = require('../config/db');
const { gerar, verificar } = require('../utils/senha');
const { autenticar, assinar } = require('../middleware/auth');
const bloqueio = require('../utils/bloqueio');
const { h, erro, texto, normalizarEmail, emailValido, validarSenha, iguais } = require('../utils/http');

const str = (v) => (typeof v === 'string' ? v : '');
const SESSAO_ALUNO = '7d';
const SESSAO_ADMIN = '2h'; // a administração tem sessões curtas

// `tabela` vem sempre do código (nunca do utilizador).
async function validarCredenciais(tabela, email, senha) {
  const [linhas] = await db.query(`SELECT * FROM ${tabela} WHERE email = ? LIMIT 1`, [email]);
  const u = linhas[0];
  const ok = await verificar(senha, u && u.senha_hash); // gasta o mesmo tempo mesmo sem conta
  return ok ? u : null;
}

const limiteRegisto = rateLimit({
  windowMs: 60 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false,
  message: { erro: 'Demasiados registos a partir deste endereço. Tente mais tarde.' },
});

// ---------- Alunos ----------
router.post('/registo', limiteRegisto, h(async (req, res) => {
  const nome = texto(req.body.nome);
  const apelido = texto(req.body.apelido);
  const email = normalizarEmail(req.body.email);
  const telefone = texto(req.body.telefone).slice(0, 30) || null;
  const senha = str(req.body.senha);

  if (!nome || !apelido || !email || !senha) throw erro(400, 'Preencha o nome, apelido, e-mail e palavra-passe.');
  if (nome.length > 90 || apelido.length > 90) throw erro(400, 'Nome ou apelido demasiado longo.');
  if (!emailValido(email)) throw erro(400, 'Indique um endereço de e-mail válido.');
  validarSenha(senha);

  const [existe] = await db.query('SELECT id FROM alunos WHERE email = ?', [email]);
  if (existe.length) throw erro(409, 'Já existe uma conta com este e-mail.');

  const hash = await gerar(senha);
  const [r] = await db.query('INSERT INTO alunos (nome, apelido, email, telefone, senha_hash) VALUES (?,?,?,?,?)', [nome, apelido, email, telefone, hash]);
  const utilizador = { id: r.insertId, nome: `${nome} ${apelido}`, email, tipo: 'aluno' };
  res.status(201).json({ token: assinar(utilizador, hash, SESSAO_ALUNO), utilizador });
}));

router.post('/login', h(async (req, res) => {
  const email = normalizarEmail(req.body.email);
  const senha = str(req.body.senha);
  if (!email || !senha) throw erro(400, 'Indique o e-mail e a palavra-passe.');
  const k = bloqueio.chave(req, 'aluno', email);
  bloqueio.verificar(k);
  const a = await validarCredenciais('alunos', email, senha);
  if (!a) { bloqueio.falhou(k); throw erro(401, 'E-mail ou palavra-passe incorretos.'); }
  bloqueio.sucesso(k);
  const utilizador = { id: a.id, nome: `${a.nome} ${a.apelido}`, email: a.email, tipo: 'aluno' };
  res.json({ token: assinar(utilizador, a.senha_hash, SESSAO_ALUNO), utilizador });
}));

// ---------- Administrador ----------
// O registo de administradores só funciona com o código secreto definido em ADMIN_CODIGO (.env).
// Sem esse código ninguém consegue criar uma conta de administrador pela internet.
router.get('/admin/registo-ativo', (req, res) => {
  res.json({ ativo: (process.env.ADMIN_CODIGO || '').length >= 12 });
});

router.post('/admin/registo', limiteRegisto, h(async (req, res) => {
  const esperado = process.env.ADMIN_CODIGO || '';
  if (esperado.length < 12) throw erro(403, 'O registo de administradores está desativado. Defina ADMIN_CODIGO (mín. 12 caracteres) no .env do servidor.');

  const k = bloqueio.chave(req, 'admin-registo');
  bloqueio.verificar(k);
  if (!iguais(str(req.body.codigo), esperado)) { bloqueio.falhou(k); throw erro(403, 'Código de autorização inválido.'); }
  bloqueio.sucesso(k);

  const nome = texto(req.body.nome);
  const email = normalizarEmail(req.body.email);
  const senha = str(req.body.senha);
  if (!nome || !email || !senha) throw erro(400, 'Preencha o nome, e-mail e palavra-passe.');
  if (nome.length > 90) throw erro(400, 'Nome demasiado longo.');
  if (!emailValido(email)) throw erro(400, 'Indique um endereço de e-mail válido.');
  validarSenha(senha, { forte: true });

  const [existe] = await db.query('SELECT id FROM utilizadores WHERE email = ?', [email]);
  if (existe.length) throw erro(409, 'Já existe uma conta de administrador com este e-mail.');

  const hash = await gerar(senha);
  const [r] = await db.query('INSERT INTO utilizadores (nome, email, senha_hash, perfil) VALUES (?,?,?,?)', [nome, email, hash, 'administrador']);
  const utilizador = { id: r.insertId, nome, email, tipo: 'administrador' };
  res.status(201).json({ token: assinar(utilizador, hash, SESSAO_ADMIN), utilizador });
}));

router.post('/admin/login', h(async (req, res) => {
  const email = normalizarEmail(req.body.email);
  const senha = str(req.body.senha);
  if (!email || !senha) throw erro(400, 'Indique o e-mail e a palavra-passe.');
  const k = bloqueio.chave(req, 'admin', email);
  bloqueio.verificar(k);
  const u = await validarCredenciais('utilizadores', email, senha);
  // Mensagem igual para "não existe", "senha errada" e "não é administrador".
  if (!u || u.perfil !== 'administrador') { bloqueio.falhou(k); throw erro(401, 'E-mail ou palavra-passe incorretos.'); }
  bloqueio.sucesso(k);
  const utilizador = { id: u.id, nome: u.nome, email: u.email, tipo: u.perfil };
  res.json({ token: assinar(utilizador, u.senha_hash, SESSAO_ADMIN), utilizador });
}));

router.get('/eu', autenticar(), (req, res) => {
  const { iat, exp, iss, sv, ...utilizador } = req.utilizador;
  res.json({ utilizador });
});

// Alterar a própria palavra-passe. Devolve uma sessão nova (as antigas deixam de valer).
router.put('/senha', autenticar(), h(async (req, res) => {
  const atual = str(req.body.senha_atual);
  const nova = str(req.body.nova_senha);
  const aluno = req.utilizador.tipo === 'aluno';
  validarSenha(nova, { forte: !aluno });
  const tabela = aluno ? 'alunos' : 'utilizadores';
  const [linhas] = await db.query(`SELECT * FROM ${tabela} WHERE id = ?`, [req.utilizador.id]);
  if (!linhas.length || !(await verificar(atual, linhas[0].senha_hash))) throw erro(400, 'A palavra-passe atual está incorreta.');
  const hash = await gerar(nova);
  await db.query(`UPDATE ${tabela} SET senha_hash = ? WHERE id = ?`, [hash, req.utilizador.id]);
  const { id, nome, email, tipo } = req.utilizador;
  res.json({ ok: true, token: assinar({ id, nome, email, tipo }, hash, aluno ? SESSAO_ALUNO : SESSAO_ADMIN) });
}));

module.exports = router;
