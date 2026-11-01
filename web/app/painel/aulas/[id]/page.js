'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { api, abrirFicheiro, urlFicheiro } from '@/lib/api';
import { atualizarProgresso, formatarTempo, lerProgresso, ordenarAulas } from '@/lib/progresso';
import Icone from '@/components/Icones';
import { Alerta, Barra, Carregando, Etiqueta } from '@/components/ui';

const VELOCIDADES = [0.75, 1, 1.25, 1.5, 2];
const SEGUNDOS_PROXIMA = 6;

export default function AulaDetalhe() {
  const { id } = useParams();
  const aulaId = Number(id);
  const router = useRouter();

  const [aula, setAula] = useState(null);
  const [lista, setLista] = useState([]);
  const [erro, setErro] = useState('');
  const [src, setSrc] = useState('');
  const [prog, setProg] = useState({});
  const [velocidade, setVelocidade] = useState(1);
  const [contagem, setContagem] = useState(null);
  const [aviso, setAviso] = useState('');

  const videoRef = useRef(null);
  const tempo = useRef({ t: 0, d: 0 });
  const ultimoGuardo = useRef(0);
  const retomar = useRef(0);
  const renovou = useRef(false);

  const ordenada = useMemo(() => ordenarAulas(lista), [lista]);
  const pos = ordenada.findIndex((a) => a.id === aulaId);
  const anterior = pos > 0 ? ordenada[pos - 1] : null;
  const seguinte = pos >= 0 && pos < ordenada.length - 1 ? ordenada[pos + 1] : null;
  const feita = !!prog[aulaId]?.feito;

  // Carregar a aula, a lista de aulas e o progresso guardado.
  useEffect(() => {
    let vivo = true;
    setAula(null); setSrc(''); setErro(''); setContagem(null); setAviso('');
    renovou.current = false;
    const p = lerProgresso();
    setProg(p);
    retomar.current = p[aulaId]?.feito ? 0 : p[aulaId]?.t || 0;
    try { const v = Number(localStorage.getItem('ead:velocidade')); if (VELOCIDADES.includes(v)) setVelocidade(v); } catch { /* ignorar */ }

    Promise.all([api(`/aulas/${id}`), api('/aulas')])
      .then(([a, todas]) => { if (vivo) { setAula(a); setLista(todas); } })
      .catch((e) => vivo && setErro(e.message));
    return () => { vivo = false; };
  }, [id, aulaId]);

  // Pedir o bilhete do ficheiro (a sessão não vai no endereço do vídeo).
  useEffect(() => {
    if (!aula?.tem_ficheiro) return;
    let vivo = true;
    urlFicheiro(aula.id).then((u) => vivo && setSrc(u)).catch((e) => vivo && setErro(e.message));
    return () => { vivo = false; };
  }, [aula]);

  const guardar = useCallback((extra = {}) => {
    const { t, d } = tempo.current;
    if (!d) return;
    const acabou = t / d >= 0.9;
    setProg(atualizarProgresso(aulaId, { t: Math.floor(t), d: Math.floor(d), ...(acabou ? { feito: true } : {}), ...extra }));
    ultimoGuardo.current = Date.now();
  }, [aulaId]);

  // Guardar a posição ao sair da página.
  useEffect(() => {
    const sair = () => guardar();
    window.addEventListener('pagehide', sair);
    return () => { window.removeEventListener('pagehide', sair); guardar(); };
  }, [guardar]);

  // Contagem para a aula seguinte.
  useEffect(() => {
    if (contagem === null) return undefined;
    if (contagem <= 0) { if (seguinte) router.push(`/painel/aulas/${seguinte.id}`); return undefined; }
    const t = setTimeout(() => setContagem((c) => (c === null ? null : c - 1)), 1000);
    return () => clearTimeout(t);
  }, [contagem, seguinte, router]);

  // Atalhos de teclado: espaço/K, J/L (±10 s), F (ecrã inteiro), M (silêncio).
  useEffect(() => {
    const tecla = (e) => {
      const v = videoRef.current;
      if (!v || e.ctrlKey || e.metaKey || e.altKey) return;
      if (/^(INPUT|SELECT|TEXTAREA|BUTTON|A)$/.test(e.target.tagName)) return;
      const k = e.key.toLowerCase();
      if (k === ' ' || k === 'k') { e.preventDefault(); v.paused ? v.play() : v.pause(); }
      else if (k === 'j') v.currentTime = Math.max(0, v.currentTime - 10);
      else if (k === 'l') v.currentTime = Math.min(v.duration || Infinity, v.currentTime + 10);
      else if (k === 'm') v.muted = !v.muted;
      else if (k === 'f') { document.fullscreenElement ? document.exitFullscreen() : v.requestFullscreen?.(); }
    };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, []);

  function aoCarregar(e) {
    const v = e.currentTarget;
    v.playbackRate = velocidade;
    tempo.current = { t: 0, d: v.duration || 0 };
    const t = retomar.current;
    if (t > 5 && v.duration && t < v.duration - 10) { v.currentTime = t; setAviso(`Retomado em ${formatarTempo(t)}`); setTimeout(() => setAviso(''), 4000); }
    retomar.current = 0;
  }

  function aoAtualizar(e) {
    const v = e.currentTarget;
    tempo.current = { t: v.currentTime, d: v.duration || 0 };
    if (Date.now() - ultimoGuardo.current > 5000) guardar();
  }

  function aoTerminar() {
    guardar({ feito: true, t: 0 });
    if (seguinte) setContagem(SEGUNDOS_PROXIMA);
  }

  // O bilhete dura 2 h: se expirar a meio, pede-se outro e continua-se de onde estava.
  function aoFalhar(e) {
    if (renovou.current) { setErro('Não foi possível reproduzir o vídeo. Atualize a página.'); return; }
    renovou.current = true;
    retomar.current = e.currentTarget.currentTime;
    urlFicheiro(aulaId).then(setSrc).catch((err) => setErro(err.message));
  }

  function mudarVelocidade(e) {
    const v = Number(e.target.value);
    setVelocidade(v);
    if (videoRef.current) videoRef.current.playbackRate = v;
    try { localStorage.setItem('ead:velocidade', String(v)); } catch { /* ignorar */ }
  }

  const alternarFeita = () => setProg(atualizarProgresso(aulaId, { feito: !feita }));
  const aceder = (fn) => fn().catch((e) => setErro(e.message));

  if (erro && !aula) return <Alerta>{erro}</Alerta>;
  if (!aula) return <Carregando />;

  const eVideo = aula.categoria === 'video';
  const modulos = ordenada.reduce((m, a) => { (m[a.capitulo] = m[a.capitulo] || []).push(a); return m; }, {});
  const concluidas = ordenada.filter((a) => prog[a.id]?.feito).length;
  const pct = ordenada.length ? Math.round((concluidas / ordenada.length) * 100) : 0;

  return (
    <>
      <Link href="/painel/aulas" className="voltar"><Icone nome="voltar" size={18} />Voltar às aulas</Link>
      <div className="player-grelha">
        <div className="player-principal">
          {!aula.tem_ficheiro && <div className="alerta ok" style={{ background: 'var(--ouro-claro)', borderColor: 'transparent', color: 'var(--ouro-txt)' }}>Esta aula ainda não tem ficheiro anexado.</div>}

          {aula.tem_ficheiro && eVideo && (
            <div className="player-caixa">
              {src ? (
                <video key={aula.id} ref={videoRef} className="player-video" src={src} controls playsInline preload="metadata" autoPlay={false}
                  onLoadedMetadata={aoCarregar} onTimeUpdate={aoAtualizar} onPause={() => guardar()} onEnded={aoTerminar} onError={aoFalhar} />
              ) : <div className="player-espera"><span className="spinner" /></div>}
              {aviso && <span className="etiqueta" style={{ position: 'absolute', top: 12, left: 12 }}>{aviso}</span>}
              {contagem !== null && seguinte && (
                <div className="player-seguinte" role="status">
                  <span>A seguir</span>
                  <b>{seguinte.titulo}</b>
                  <span>Começa em {contagem} s</span>
                  <div className="linha">
                    <button className="botao botao-ouro" onClick={() => router.push(`/painel/aulas/${seguinte.id}`)}>Ver agora</button>
                    <button className="botao botao-claro" onClick={() => setContagem(null)}>Cancelar</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {aula.tem_ficheiro && !eVideo && (src ? <iframe className="player-pdf" title={aula.titulo} src={src} /> : <div className="player-espera" style={{ borderRadius: 'var(--raio)' }}><span className="spinner" /></div>)}

          <Alerta>{erro}</Alerta>

          <div className="player-barra">
            {anterior ? <Link className="botao botao-sec botao-peq" href={`/painel/aulas/${anterior.id}`}><Icone nome="voltar" size={16} />Anterior</Link> : <span />}
            {seguinte && <Link className="botao botao-sec botao-peq" href={`/painel/aulas/${seguinte.id}`}>Seguinte<Icone nome="seguinte" size={16} /></Link>}
            <span className="espaco" />
            {eVideo && aula.tem_ficheiro && (
              <label>Velocidade
                <select value={velocidade} onChange={mudarVelocidade} aria-label="Velocidade de reprodução">
                  {VELOCIDADES.map((v) => <option key={v} value={v}>{v === 1 ? 'Normal' : `${v}×`}</option>)}
                </select>
              </label>
            )}
            <button className={`botao botao-peq ${feita ? '' : 'botao-sec'}`} onClick={alternarFeita} aria-pressed={feita}>
              <Icone nome="concluido" size={16} />{feita ? 'Concluída' : 'Marcar como concluída'}
            </button>
          </div>

          <div className="player-info">
            <Etiqueta>{aula.capitulo}</Etiqueta>
            <h1>{aula.titulo}</h1>
            {aula.descricao && <p className="suave" style={{ maxWidth: 760, whiteSpace: 'pre-line' }}>{aula.descricao}</p>}
            <div className="linha mt">
              {aula.tem_ficheiro && !eVideo && <button className="botao botao-sec" onClick={() => aceder(() => abrirFicheiro(aula.id))}>Abrir em nova janela</button>}
              {aula.tem_ficheiro && <button className="botao botao-sec" onClick={() => aceder(() => abrirFicheiro(aula.id, true))}><Icone nome="download" size={18} />Descarregar</button>}
              <Link className="botao" href={`/painel/exercicios/${aula.id}`}><Icone nome="exercicios" size={18} />Fazer os exercícios</Link>
            </div>
            {eVideo && aula.tem_ficheiro && <p className="player-dica"><kbd>Espaço</kbd> pausar · <kbd>J</kbd> / <kbd>L</kbd> recuar / avançar 10 s · <kbd>F</kbd> ecrã inteiro · <kbd>M</kbd> sem som</p>}
          </div>
        </div>

        <aside className="cartao lista-aulas" aria-label="Aulas do curso">
          <div className="lista-aulas-topo">
            <h3>Conteúdo do curso</h3>
            <Barra valor={pct} cor="ok" />
            <small>{concluidas} de {ordenada.length} aulas concluídas</small>
          </div>
          <nav className="lista-aulas-corpo">
            {Object.entries(modulos).map(([modulo, itens]) => (
              <div key={modulo}>
                <p className="lista-modulo">{modulo}</p>
                {itens.map((a) => {
                  const p = prog[a.id];
                  const estado = p?.feito ? 'feito' : '';
                  return (
                    <Link key={a.id} href={`/painel/aulas/${a.id}`} className={`lista-item ${estado}${a.id === aulaId ? ' ativo' : ''}`} aria-current={a.id === aulaId ? 'page' : undefined}>
                      <Icone nome={p?.feito ? 'concluido' : a.categoria === 'video' ? 'play' : 'arquivo'} size={18} />
                      <span className="txt">{a.titulo}<small>{a.categoria === 'video' ? 'Vídeo' : 'PDF'}{p?.d ? ` · ${formatarTempo(p.d)}` : ''}{!p?.feito && p?.t > 5 ? ' · em curso' : ''}</small></span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </aside>
      </div>
    </>
  );
}
