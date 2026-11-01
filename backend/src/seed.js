// Dados iniciais: administrador, aluno de demonstração e uma aula com exercícios.
require('dotenv').config();
const db = require('./config/db');
const { gerar } = require('./utils/senha');
const { validarSenha } = require('./utils/http');

(async () => {
  // O administrador cria-se em /admin/registo (com ADMIN_CODIGO). Opcionalmente, defina
  // SEED_ADMIN_EMAIL e SEED_ADMIN_SENHA no .env para o criar aqui. Nunca há palavra-passe por defeito.
  const [adm] = await db.query('SELECT id FROM utilizadores LIMIT 1');
  if (!adm.length && process.env.SEED_ADMIN_EMAIL && process.env.SEED_ADMIN_SENHA) {
    validarSenha(process.env.SEED_ADMIN_SENHA, { forte: true });
    await db.query('INSERT INTO utilizadores (nome, email, senha_hash, perfil) VALUES (?,?,?,?)', ['Administrador', process.env.SEED_ADMIN_EMAIL.toLowerCase(), await gerar(process.env.SEED_ADMIN_SENHA), 'administrador']);
    console.log(`Administrador criado: ${process.env.SEED_ADMIN_EMAIL}`);
  } else if (!adm.length) {
    console.log('Ainda não há administrador: crie-o em http://localhost:3000/admin/registo (precisa de ADMIN_CODIGO no .env).');
  }
  if (process.env.NODE_ENV === 'production') { await db.end(); return; } // sem contas/dados de demonstração em produção
  const [al] = await db.query('SELECT id FROM alunos LIMIT 1');
  if (!al.length) {
    await db.query('INSERT INTO alunos (nome, apelido, email, senha_hash) VALUES (?,?,?,?)', ['Aluno', 'Demonstração', 'aluno@ead.com', await gerar('aluno123')]);
    console.log('Aluno de demonstração →  e-mail: aluno@ead.com   palavra-passe: aluno123');
  }
  const [au] = await db.query('SELECT id FROM aulas LIMIT 1');
  if (!au.length) {
    const [r] = await db.query(
      'INSERT INTO aulas (capitulo, titulo, descricao, categoria) VALUES (?,?,?,?)',
      ['Módulo 1', 'Introdução à plataforma', 'Aula de demonstração. No painel de administração pode anexar um PDF ou um vídeo a esta aula.', 'documento']
    );
    const qs = [
      ['Qual é a capital de Angola?', 'Luanda', 'Benguela', 'Huambo', 'Lubango', 'A'],
      ['Quantos dias tem uma semana?', 'Cinco', 'Seis', 'Sete', 'Oito', 'C'],
      ['Quanto é 7 × 6?', '36', '42', '48', '54', 'B'],
    ];
    for (const q of qs) {
      await db.query('INSERT INTO exercicios (aula_id, pergunta, opcao_a, opcao_b, opcao_c, opcao_d, resposta) VALUES (?,?,?,?,?,?,?)', [r.insertId, ...q]);
    }
    console.log('Aula de demonstração criada com 3 exercícios.');
  }
  await db.end();
})().catch((e) => { console.error('Falha no seed:', e.message); process.exit(1); });
