import Icone from './Icones';

export const iniciais = (nome = '') => nome.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();

export const Avatar = ({ nome }) => <span className="avatar" aria-hidden="true">{iniciais(nome)}</span>;

export function Alerta({ tipo = 'erro', children }) {
  if (!children) return null;
  return <div className={`alerta ${tipo}`} role={tipo === 'erro' ? 'alert' : 'status'}>{children}</div>;
}

export function Campo({ rotulo, id, icone, dica, children }) {
  return (
    <div className="campo">
      <label htmlFor={id}>{rotulo}</label>
      {icone ? <div className="input-icone"><Icone nome={icone} size={18} />{children}</div> : children}
      {dica && <small className="suave">{dica}</small>}
    </div>
  );
}

export const Etiqueta = ({ tipo = '', children }) => <span className={`etiqueta ${tipo}`}>{children}</span>;

export const Barra = ({ valor, cor = '' }) => (
  <div className="barra" role="progressbar" aria-valuenow={valor} aria-valuemin={0} aria-valuemax={100}><span className={cor} style={{ width: `${valor}%` }} /></div>
);

export function Vazio({ icone = 'livro', titulo, texto, children }) {
  return (
    <div className="vazio">
      <span className="vazio-icone"><Icone nome={icone} size={28} /></span>
      <h3>{titulo}</h3>
      {texto && <p className="suave">{texto}</p>}
      {children}
    </div>
  );
}

export const Carregando = () => <div className="carregando"><span className="spinner" /> A carregar…</div>;

export function TituloPagina({ titulo, sub, children }) {
  return (
    <div className="pag-topo">
      <div><h1>{titulo}</h1>{sub && <p className="suave">{sub}</p>}</div>
      {children && <div className="linha">{children}</div>}
    </div>
  );
}

export function Estatistica({ icone, rotulo, valor, tom = '' }) {
  return (
    <div className="cartao stat">
      <span className={`stat-icone ${tom}`}><Icone nome={icone} size={22} /></span>
      <div><span className="suave">{rotulo}</span><span className="estat">{valor}</span></div>
    </div>
  );
}
