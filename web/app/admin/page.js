'use client';
import { useEffect, useState } from 'react';
import { api, formatarData } from '@/lib/api';
import { Alerta, Avatar, Barra, Carregando, Estatistica, TituloPagina, Vazio } from '@/components/ui';

export default function Painel() {
  const [r, setR] = useState(null);
  const [rel, setRel] = useState([]);
  const [erro, setErro] = useState('');

  useEffect(() => {
    Promise.all([api('/admin/resumo'), api('/admin/relatorio')])
      .then(([a, b]) => { setR(a); setRel(b); })
      .catch((e) => setErro(e.message));
  }, []);

  return (
    <>
      <TituloPagina titulo="Painel" sub="Visão geral da plataforma." />
      <Alerta>{erro}</Alerta>
      {!r && !erro && <Carregando />}
      {r && (
        <>
          <div className="grelha">
            <Estatistica icone="utilizadores" rotulo="Alunos" valor={r.alunos} />
            <Estatistica icone="livro" rotulo="Aulas" valor={r.aulas} tom="ouro" />
            <Estatistica icone="exercicios" rotulo="Exercícios" valor={r.exercicios} tom="navy" />
            <Estatistica icone="grafico" rotulo="Média geral" valor={r.media != null ? `${r.media}%` : '—'} tom="ok" />
          </div>

          <div className="dois" style={{ marginTop: '1.5rem' }}>
            <section className="cartao">
              <h3>Desempenho por aula</h3>
              <p className="suave">Média das pontuações dos alunos.</p>
              {rel.length === 0 && <p className="suave">Sem dados.</p>}
              <div className="grafico">
                {rel.map((l) => (
                  <div className="grafico-linha" key={l.id}>
                    <span title={l.titulo}>{l.titulo}</span>
                    <Barra valor={l.media || 0} cor="ok" />
                    <b>{l.media != null ? `${l.media}%` : '—'}</b>
                  </div>
                ))}
              </div>
            </section>

            <section className="cartao">
              <h3>Últimos alunos registados</h3>
              {r.ultimos_alunos.length === 0 && <Vazio icone="utilizadores" titulo="Sem alunos" texto="Os novos registos vão aparecer aqui." />}
              <div style={{ display: 'grid', gap: '.8rem', marginTop: '.8rem' }}>
                {r.ultimos_alunos.map((a) => (
                  <div className="pessoa" key={a.id}>
                    <Avatar nome={`${a.nome} ${a.apelido}`} />
                    <div style={{ minWidth: 0 }}><b>{a.nome} {a.apelido}</b><small>{a.email} · {formatarData(a.criado_em)}</small></div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </>
      )}
    </>
  );
}
