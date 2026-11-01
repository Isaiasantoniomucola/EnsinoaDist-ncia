// Rotas do aluno: aulas, ficheiros, exercícios e submissão.
const router = require('express').Router();
const path = require('path');
const fs = require('fs');
const db = require('../config/db');
const { autenticar, emitirBilhete, verificarBilhete } = require('../middleware/auth');
const { h, erro } = require('../utils/http');

async function obterAula(id) {
  const [linhas] = await db.query(
    'SELECT id, capitulo, titulo, descricao, categoria, nome_original, ficheiro IS NOT NULL AS tem_ficheiro FROM aulas WHERE id = ?',
    [Number(id) || 0]
  );
  if (!linhas.length) throw erro(404, 'Aula não encontrada.');
  const a = linhas[0];
  return { ...a, tem_ficheiro: !!a.tem_ficheiro };
}

// Bilhete curto (2 h) para abrir ou descarregar o ficheiro de UMA aula. Serve para <video>, <iframe>
// e descarregamentos, que não conseguem enviar o cabeçalho Authorization. A sessão nunca vai no URL.
router.post('/:id/bilhete', autenticar(['aluno', 'administrador']), h(async (req, res) => {
  const aula = await obterAula(req.params.id);
  if (!aula.tem_ficheiro) throw erro(404, 'Esta aula não tem ficheiro.');
  res.json({ bilhete: emitirBilhete(req.utilizador, aula.id) });
}));

router.get('/:id/ficheiro', h(async (req, res) => {
  if (!verificarBilhete(req.query.b, req.params.id)) throw erro(401, 'Ligação expirada. Volte a abrir a aula.');
  const [linhas] = await db.query('SELECT ficheiro, nome_original FROM aulas WHERE id = ?', [Number(req.params.id) || 0]);
  if (!linhas.length || !linhas[0].ficheiro) throw erro(404, 'Esta aula não tem ficheiro.');
  const caminho = path.join(req.app.get('uploadDir'), path.basename(linhas[0].ficheiro));
  if (!fs.existsSync(caminho)) throw erro(404, 'Ficheiro não encontrado no servidor.');
  res.set('Cache-Control', 'private, max-age=0');
  if (req.query.download) return res.download(caminho, linhas[0].nome_original || path.basename(caminho));
  res.sendFile(caminho); // suporta pedidos Range (avançar no vídeo)
}));

router.use(autenticar(['aluno']));

router.get('/', h(async (req, res) => {
  const [linhas] = await db.query(
    `SELECT a.id, a.capitulo, a.titulo, a.descricao, a.categoria, a.nome_original,
            a.ficheiro IS NOT NULL AS tem_ficheiro,
            (SELECT COUNT(*) FROM exercicios e WHERE e.aula_id = a.id) AS total_exercicios,
            r.pontuacao, r.total AS total_resultado
       FROM aulas a
       LEFT JOIN resultados r ON r.aula_id = a.id AND r.aluno_id = ?
      ORDER BY a.capitulo, a.id`,
    [req.utilizador.id]
  );
  res.json(linhas.map((l) => ({ ...l, tem_ficheiro: !!l.tem_ficheiro })));
}));

router.get('/:id', h(async (req, res) => {
  res.json(await obterAula(req.params.id));
}));

router.get('/:id/exercicios', h(async (req, res) => {
  const aula = await obterAula(req.params.id);
  const [exs] = await db.query(
    'SELECT id, pergunta, opcao_a, opcao_b, opcao_c, opcao_d, resposta FROM exercicios WHERE aula_id = ? ORDER BY id',
    [aula.id]
  );
  const [res1] = await db.query(
    'SELECT pontuacao, total, submetido_em FROM resultados WHERE aluno_id = ? AND aula_id = ?',
    [req.utilizador.id, aula.id]
  );
  const resultado = res1[0] || null;

  const escolhas = {};
  if (resultado) {
    const [rs] = await db.query(
      'SELECT exercicio_id, escolha, correta FROM respostas WHERE aluno_id = ? AND aula_id = ?',
      [req.utilizador.id, aula.id]
    );
    rs.forEach((r) => { escolhas[r.exercicio_id] = r; });
  }

  // A resposta certa só é revelada depois de o aluno submeter.
  const exercicios = exs.map((e) => {
    const base = { id: e.id, pergunta: e.pergunta, opcoes: { A: e.opcao_a, B: e.opcao_b, C: e.opcao_c, D: e.opcao_d } };
    if (!resultado) return base;
    const r = escolhas[e.id];
    return { ...base, resposta_correta: e.resposta, escolha: r ? r.escolha : null, correta: !!(r && r.correta) };
  });

  res.json({
    aula: { id: aula.id, capitulo: aula.capitulo, titulo: aula.titulo, categoria: aula.categoria },
    exercicios,
    resultado,
  });
}));

router.post('/:id/submeter', h(async (req, res) => {
  const aula = await obterAula(req.params.id);
  const respostas = req.body.respostas && typeof req.body.respostas === 'object' ? req.body.respostas : {};
  const [exs] = await db.query('SELECT id, resposta FROM exercicios WHERE aula_id = ?', [aula.id]);
  if (!exs.length) throw erro(400, 'Esta aula ainda não tem exercícios.');

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [ja] = await conn.query('SELECT id FROM resultados WHERE aluno_id = ? AND aula_id = ? FOR UPDATE', [req.utilizador.id, aula.id]);
    if (ja.length) throw erro(409, 'Já submeteu os exercícios desta aula.');

    let pontos = 0;
    for (const e of exs) {
      const esc = String(respostas[e.id] || '').toUpperCase();
      const valida = ['A', 'B', 'C', 'D'].includes(esc) ? esc : null;
      const correta = valida === e.resposta;
      if (correta) pontos += 1;
      await conn.query(
        `INSERT INTO respostas (aluno_id, exercicio_id, aula_id, escolha, correta) VALUES (?,?,?,?,?)
         ON DUPLICATE KEY UPDATE escolha = VALUES(escolha), correta = VALUES(correta)`,
        [req.utilizador.id, e.id, aula.id, valida, correta ? 1 : 0]
      );
    }
    await conn.query('INSERT INTO resultados (aluno_id, aula_id, pontuacao, total) VALUES (?,?,?,?)', [req.utilizador.id, aula.id, pontos, exs.length]);
    await conn.commit();
    res.status(201).json({ pontuacao: pontos, total: exs.length });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}));

module.exports = router;
