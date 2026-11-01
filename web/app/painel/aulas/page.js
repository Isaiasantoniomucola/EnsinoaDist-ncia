'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatarTempo, lerProgresso, ordenarAulas } from '@/lib/progresso';
import Icone from '@/components/Icones';
import { Alerta, Barra, Carregando, Etiqueta, TituloPagina, Vazio } from '@/components/ui';

function Estado({ p }) {
  if (p?.feito) return <span className="estado feito"><Icone nome="concluido" size={15} />Concluída</span>;
  if (p?.t > 5) return <span className="estado curso"><Icone nome="relogio" size={15} />Em curso · {formatarTempo(p.t)}</span>;
  return <span className="estado novo">Nova</span>;
}

export default function Aulas() {
  const [aulas, setAulas] = useState(null);
  const [erro, setErro] = useState('');
  const [busca, setBusca] = useState('');
  const [tipo, setTipo] = useState('todas');
  const [prog, setProg] = useState({});
  useEffect(() => { setProg(lerProgresso()); api('/aulas').then(setAulas).catch((e) => setErro(e.message)); }, []);

  const lista = useMemo(() => ordenarAulas((aulas || []).filter((a) =>
    (tipo === 'todas' || a.categoria === tipo) && `${a.titulo} ${a.capitulo}`.toLowerCase().includes(busca.toLowerCase()))), [aulas, tipo, busca]);

  const modulos = useMemo(() => lista.reduce((m, a) => { (m[a.capitulo] = m[a.capitulo] || []).push(a); return m; }, {}), [lista]);

  // Última aula começada e ainda não concluída.
  const continuar = useMemo(() => {
    if (!aulas) return null;
    const c = aulas.filter((a) => prog[a.id] && !prog[a.id].feito && prog[a.id].t > 5).sort((a, b) => prog[b.id].em - prog[a.id].em);
    return c[0] || null;
  }, [aulas, prog]);

  return (
    <>
      <TituloPagina titulo="Aulas" sub="Vídeos e documentos organizados por módulo." />
      <Alerta>{erro}</Alerta>

      {continuar && !busca && tipo === 'todas' && (
        <div className="cartao continuar">
          <div>
            <span className="suave">Continuar a ver</span>
            <h3>{continuar.titulo}</h3>
            <small className="suave">{continuar.capitulo} · parou em {formatarTempo(prog[continuar.id].t)}</small>
          </div>
          <Link className="botao botao-ouro" href={`/painel/aulas/${continuar.id}`}><Icone nome="play" size={18} />Continuar</Link>
        </div>
      )}

      <div className="ferramentas">
        <div className="pesquisa"><Icone nome="pesquisa" size={18} /><input type="search" placeholder="Pesquisar aulas…" value={busca} onChange={(e) => setBusca(e.target.value)} aria-label="Pesquisar aulas" /></div>
        <div className="chips">
          {[['todas', 'Todas'], ['video', 'Vídeos'], ['documento', 'PDF']].map(([k, t]) => (
            <button key={k} className={`chip${tipo === k ? ' ativo' : ''}`} onClick={() => setTipo(k)}>{t}</button>
          ))}
        </div>
      </div>

      {!aulas && !erro && <Carregando />}
      {aulas && lista.length === 0 && <Vazio titulo="Nenhuma aula encontrada" texto="Experimente outra pesquisa ou outro filtro." />}

      {Object.entries(modulos).map(([modulo, itens]) => {
        const feitas = itens.filter((a) => prog[a.id]?.feito).length;
        return (
          <section className="modulo" key={modulo}>
            <div className="modulo-topo">
              <h2>{modulo}</h2>
              <div className="modulo-prog"><Barra valor={Math.round((feitas / itens.length) * 100)} cor="ok" /><span>{feitas}/{itens.length}</span></div>
            </div>
            <div className="grelha">
              {itens.map((a) => (
                <article className="cartao aula-card" key={a.id}>
                  <div className={`aula-capa${a.categoria === 'video' ? '' : ' doc'}`}>
                    <Etiqueta>{a.categoria === 'video' ? 'Vídeo' : 'PDF'}</Etiqueta>
                    <Icone nome={a.categoria === 'video' ? 'play' : 'arquivo'} size={38} />
                  </div>
                  <div className="aula-corpo">
                    <Estado p={prog[a.id]} />
                    <h3>{a.titulo}</h3>
                    {a.descricao && <p className="suave">{a.descricao.length > 100 ? `${a.descricao.slice(0, 100)}…` : a.descricao}</p>}
                    <Link className="botao botao-peq" href={`/painel/aulas/${a.id}`}>{a.categoria === 'video' ? (prog[a.id]?.t > 5 && !prog[a.id]?.feito ? 'Continuar' : 'Ver vídeo') : 'Abrir documento'}</Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}
