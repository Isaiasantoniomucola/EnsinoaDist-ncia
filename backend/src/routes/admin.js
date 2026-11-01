// Rotas do painel de administração (só administrador).
const router = require('express').Router();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const db = require('../config/db');
const { autenticar } = require('../middleware/auth');
const { gerar } = require('../utils/senha');
const { h, erro, texto, normalizarEmail, emailValido, validarSenha } = require('../utils/http');

// Toda a administração é exclusiva do administrador (conta, perfil e palavra-passe verificados em cada pedido).
router.use(autenticar(['administrador']));

/* ---------- Envio de ficheiros ---------- */
const EXT_DOC = ['.pdf'];
const EXT_VIDEO = ['.mp4', '.webm', '.ogg', '.mov', '.m4v'];

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, req.app.get('uploadDir')),
    filename: (req, file, cb) =>
      cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${path.extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if ([...EXT_DOC, ...EXT_VIDEO].includes(ext)) return cb(null, true);
    cb(erro(400, 'Formato não suportado. Use PDF, MP4, WEBM, OGG ou MOV.'));
  },
});

const apagarFicheiro = (req, nome) => {
  if (!nome) return;
  fs.unlink(path.join(req.app.get('uploadDir'), path.basename(nome)), () => {});
};

function dadosAula(req) {
  const capitulo = texto(req.body.capitulo);
  const titulo = texto(req.body.titulo);
  const descricao = texto(req.body.descricao) || null;
  const categoria = texto(req.body.categoria);
  if (!capitulo || !titulo) throw erro(400, 'Indique o capítulo e o título.');
  if (!['documento', 'video'].includes(categoria)) throw erro(400, 'Categoria inválida.');
  if (req.file) {
    const ext = path.extname(req.file.originalname).toLowerCase();
    const permitidas = categoria === 'documento' ? EXT_DOC : EXT_VIDEO;
    if (!permitidas.includes(ext)) {
      throw erro(400, categoria === 'documento' ? 'Para documentos envie um ficheiro PDF.' : 'Para vídeos envie MP4, WEBM, OGG ou MOV.');
    }
  }
  return { capitulo, titulo, descricao, categoria };
}

// Confirma pelo conteúdo (e não só pela extensão) que o ficheiro é mesmo PDF ou vídeo.
async function validarConteudo(ficheiro) {
  if (!ficheiro) return;
  const ext = path.extname(ficheiro.originalname).toLowerCase();
  const fd = await fs.promises.open(ficheiro.path, 'r');
  const buf = Buffer.alloc(12);
  try { await fd.read(buf, 0, 12, 0); } finally { await fd.close(); }
  const ascii = (a, b) => buf.toString('latin1', a, b);
  let ok = false;
  if (ext === '.pdf') ok = ascii(0, 4) === '%PDF';
  else if (['.mp4', '.mov', '.m4v'].includes(ext)) ok = ascii(4, 8) === 'ftyp';
  else if (ext === '.webm') ok = buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3;
  else if (ext === '.ogg') ok = ascii(0, 4) === 'OggS';
  if (!ok) throw erro(400, 'O conteúdo do ficheiro não corresponde ao formato indicado.');
}

const nomeOriginal = (f) => Buffer.from(f.originalname, 'latin1').toString('utf8');

/* ---------- Resumo e relatório ---------- */
router.get('/resumo', h(async (req, res) => {
  const [[r]] = await db.query(
    `SELECT (SELECT COUNT(*) FROM alunos) AS alunos,
            (SELECT COUNT(*) FROM aulas) AS aulas,
            (SELECT COUNT(*) FROM exercicios) AS exercicios,
            (SELECT COUNT(*) FROM resultados) AS submissoes,
            (SELECT ROUND(AVG(pontuacao / NULLIF(total, 0)) * 100, 1) FROM resultados) AS media`
  );
  const [ultimos] = await db.query('SELECT id, nome, apelido, email, criado_em FROM alunos ORDER BY id DESC LIMIT 5');
  res.json({ ...r, ultimos_alunos: ultimos });
}));

router.get('/relatorio', h(async (req, res) => {
  const [linhas] = await db.query(
    `SELECT a.id, a.capitulo, a.titulo, COUNT(r.id) AS participantes,
            ROUND(AVG(r.pontuacao / NULLIF(r.total, 0)) * 100, 1) AS media
       FROM aulas a LEFT JOIN resultados r ON r.aula_id = a.id
      GROUP BY a.id ORDER BY a.capitulo, a.id`
  );
  res.json(linhas);
}));

/* ---------- Aulas ---------- */
router.get('/aulas', h(async (req, res) => {
  const [linhas] = await db.query(
    `SELECT a.id, a.capitulo, a.titulo, a.descricao, a.categoria, a.nome_original, a.ficheiro IS NOT NULL AS tem_ficheiro,
            (SELECT COUNT(*) FROM exercicios e WHERE e.aula_id = a.id) AS total_exercicios
       FROM aulas a ORDER BY a.capitulo, a.id`
  );
  res.json(linhas.map((l) => ({ ...l, tem_ficheiro: !!l.tem_ficheiro })));
}));

router.post('/aulas', upload.single('ficheiro'), h(async (req, res) => {
  try {
    const d = dadosAula(req);
    await validarConteudo(req.file);
    const [r] = await db.query(
      'INSERT INTO aulas (capitulo, titulo, descricao, categoria, ficheiro, nome_original) VALUES (?,?,?,?,?,?)',
      [d.capitulo, d.titulo, d.descricao, d.categoria, req.file ? req.file.filename : null, req.file ? nomeOriginal(req.file) : null]
    );
    res.status(201).json({ id: r.insertId });
  } catch (e) {
    if (req.file) apagarFicheiro(req, req.file.filename);
    throw e;
  }
}));

router.put('/aulas/:id', upload.single('ficheiro'), h(async (req, res) => {
  try {
    const id = Number(req.params.id) || 0;
    const [atual] = await db.query('SELECT ficheiro FROM aulas WHERE id = ?', [id]);
    if (!atual.length) throw erro(404, 'Aula não encontrada.');
    const d = dadosAula(req);
    await validarConteudo(req.file);
    if (req.file) {
      await db.query(
        'UPDATE aulas SET capitulo=?, titulo=?, descricao=?, categoria=?, ficheiro=?, nome_original=? WHERE id=?',
        [d.capitulo, d.titulo, d.descricao, d.categoria, req.file.filename, nomeOriginal(req.file), id]
      );
      apagarFicheiro(req, atual[0].ficheiro);
    } else {
      await db.query('UPDATE aulas SET capitulo=?, titulo=?, descricao=?, categoria=? WHERE id=?', [d.capitulo, d.titulo, d.descricao, d.categoria, id]);
    }
    res.json({ ok: true });
  } catch (e) {
    if (req.file) apagarFicheiro(req, req.file.filename);
    throw e;
  }
}));

router.delete('/aulas/:id', h(async (req, res) => {
  const id = Number(req.params.id) || 0;
  const [atual] = await db.query('SELECT ficheiro FROM aulas WHERE id = ?', [id]);
  if (!atual.length) throw erro(404, 'Aula não encontrada.');
  await db.query('DELETE FROM aulas WHERE id = ?', [id]);
  apagarFicheiro(req, atual[0].ficheiro);
  res.json({ ok: true });
}));

/* ---------- Exercícios ---------- */
async function dadosExercicio(body) {
  const d = {
    aula_id: Number(body.aula_id) || 0,
    pergunta: texto(body.pergunta),
    opcao_a: texto(body.opcao_a),
    opcao_b: texto(body.opcao_b),
    opcao_c: texto(body.opcao_c),
    opcao_d: texto(body.opcao_d),
    resposta: texto(body.resposta).toUpperCase(),
  };
  if (!d.pergunta || !d.opcao_a || !d.opcao_b || !d.opcao_c || !d.opcao_d) throw erro(400, 'Preencha a pergunta e as quatro opções.');
  if (!['A', 'B', 'C', 'D'].includes(d.resposta)) throw erro(400, 'Indique a resposta correta (A, B, C ou D).');
  const [aula] = await db.query('SELECT id FROM aulas WHERE id = ?', [d.aula_id]);
  if (!aula.length) throw erro(400, 'Selecione uma aula válida.');
  return d;
}

router.get('/exercicios', h(async (req, res) => {
  const aula = Number(req.query.aula_id) || null;
  const [linhas] = await db.query(
    `SELECT e.*, a.capitulo, a.titulo AS aula_titulo FROM exercicios e JOIN aulas a ON a.id = e.aula_id
      ${aula ? 'WHERE e.aula_id = ?' : ''} ORDER BY a.capitulo, e.aula_id, e.id`,
    aula ? [aula] : []
  );
  res.json(linhas);
}));

router.post('/exercicios', h(async (req, res) => {
  const d = await dadosExercicio(req.body);
  const [r] = await db.query(
    'INSERT INTO exercicios (aula_id, pergunta, opcao_a, opcao_b, opcao_c, opcao_d, resposta) VALUES (?,?,?,?,?,?,?)',
    [d.aula_id, d.pergunta, d.opcao_a, d.opcao_b, d.opcao_c, d.opcao_d, d.resposta]
  );
  res.status(201).json({ id: r.insertId });
}));

router.put('/exercicios/:id', h(async (req, res) => {
  const d = await dadosExercicio(req.body);
  const [r] = await db.query(
    'UPDATE exercicios SET aula_id=?, pergunta=?, opcao_a=?, opcao_b=?, opcao_c=?, opcao_d=?, resposta=? WHERE id=?',
    [d.aula_id, d.pergunta, d.opcao_a, d.opcao_b, d.opcao_c, d.opcao_d, d.resposta, Number(req.params.id) || 0]
  );
  if (!r.affectedRows) throw erro(404, 'Exercício não encontrado.');
  res.json({ ok: true });
}));

router.delete('/exercicios/:id', h(async (req, res) => {
  await db.query('DELETE FROM exercicios WHERE id = ?', [Number(req.params.id) || 0]);
  res.json({ ok: true });
}));

/* ---------- Alunos ---------- */
router.get('/alunos', h(async (req, res) => {
  const [linhas] = await db.query(
    `SELECT a.id, a.nome, a.apelido, a.email, a.telefone, a.criado_em,
            (SELECT COUNT(*) FROM resultados r WHERE r.aluno_id = a.id) AS aulas_concluidas
       FROM alunos a ORDER BY a.nome, a.apelido`
  );
  res.json(linhas);
}));

router.get('/alunos/:id', h(async (req, res) => {
  const id = Number(req.params.id) || 0;
  const [alunos] = await db.query('SELECT id, nome, apelido, email, telefone, criado_em FROM alunos WHERE id = ?', [id]);
  if (!alunos.length) throw erro(404, 'Aluno não encontrado.');
  const [resultados] = await db.query(
    `SELECT r.aula_id, au.capitulo, au.titulo, r.pontuacao, r.total, r.submetido_em
       FROM resultados r JOIN aulas au ON au.id = r.aula_id WHERE r.aluno_id = ? ORDER BY r.submetido_em DESC`,
    [id]
  );
  res.json({ ...alunos[0], resultados });
}));

// Permite ao aluno repetir os exercícios de uma aula.
router.delete('/alunos/:id/resultados/:aulaId', h(async (req, res) => {
  const id = Number(req.params.id) || 0;
  const aula = Number(req.params.aulaId) || 0;
  await db.query('DELETE FROM respostas WHERE aluno_id = ? AND aula_id = ?', [id, aula]);
  await db.query('DELETE FROM resultados WHERE aluno_id = ? AND aula_id = ?', [id, aula]);
  res.json({ ok: true });
}));

router.delete('/alunos/:id', h(async (req, res) => {
  await db.query('DELETE FROM alunos WHERE id = ?', [Number(req.params.id) || 0]);
  res.json({ ok: true });
}));

/* ---------- Administradores ---------- */

router.get('/utilizadores', h(async (req, res) => {
  const [linhas] = await db.query('SELECT id, nome, email, perfil, criado_em FROM utilizadores WHERE perfil = ? ORDER BY nome', ['administrador']);
  res.json(linhas);
}));

function dadosUtilizador(body, senhaObrigatoria) {
  const d = {
    nome: texto(body.nome),
    email: normalizarEmail(body.email),
    perfil: texto(body.perfil),
    senha: typeof body.senha === 'string' ? body.senha : '',
  };
  if (!d.nome || !d.email) throw erro(400, 'Indique o nome e o e-mail.');
  if (!emailValido(d.email)) throw erro(400, 'Indique um endereço de e-mail válido.');
  d.perfil = 'administrador'; // a área de administração é só para administradores
  if (senhaObrigatoria || d.senha) validarSenha(d.senha, { forte: true });
  return d;
}

router.post('/utilizadores', h(async (req, res) => {
  const d = dadosUtilizador(req.body, true);
  const [r] = await db.query('INSERT INTO utilizadores (nome, email, senha_hash, perfil) VALUES (?,?,?,?)', [d.nome, d.email, await gerar(d.senha), d.perfil]);
  res.status(201).json({ id: r.insertId });
}));

router.put('/utilizadores/:id', h(async (req, res) => {
  const id = Number(req.params.id) || 0;
  const d = dadosUtilizador(req.body, false);
  if (d.senha) {
    await db.query('UPDATE utilizadores SET nome=?, email=?, perfil=?, senha_hash=? WHERE id=? AND perfil = "administrador"', [d.nome, d.email, d.perfil, await gerar(d.senha), id]);
  } else {
    await db.query('UPDATE utilizadores SET nome=?, email=?, perfil=? WHERE id=? AND perfil = "administrador"', [d.nome, d.email, d.perfil, id]);
  }
  res.json({ ok: true });
}));

router.delete('/utilizadores/:id', h(async (req, res) => {
  const id = Number(req.params.id) || 0;
  if (id === req.utilizador.id) throw erro(400, 'Não pode eliminar a sua própria conta.');
  await db.query('DELETE FROM utilizadores WHERE id = ?', [id]);
  res.json({ ok: true });
}));

module.exports = router;
