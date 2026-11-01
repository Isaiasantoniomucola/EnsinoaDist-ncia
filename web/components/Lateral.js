'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import Icone from './Icones';
import Logo from './Logo';
import { Avatar } from './ui';
import { BotaoTema } from './Tema';

export default function Lateral({ links, nome, perfil, onSair, children }) {
  const caminho = usePathname();
  const [aberta, setAberta] = useState(false);
  const ativo = (href) => (href === links[0].href ? caminho === href : caminho.startsWith(href));

  return (
    <div className="shell">
      <aside className={`lateral${aberta ? ' aberta' : ''}`}>
        <div className="lateral-topo"><Logo claro /></div>
        <nav className="lateral-nav">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className={ativo(l.href) ? 'ativo' : ''} onClick={() => setAberta(false)}>
              <Icone nome={l.icone} size={19} />{l.texto}
            </Link>
          ))}
        </nav>
        <div className="lateral-rodape">
          <div className="lateral-user"><Avatar nome={nome} /><div><b>{nome}</b><small>{perfil}</small></div></div>
          <BotaoTema comTexto />
          <button className="lateral-sair" onClick={onSair}><Icone nome="sair" size={18} />Terminar sessão</button>
        </div>
      </aside>
      {aberta && <div className="lateral-fundo" onClick={() => setAberta(false)} />}
      <div className="shell-main">
        <header className="barra-topo">
          <button className="icone-btn" onClick={() => setAberta(true)} aria-label="Abrir menu"><Icone nome="menu" /></button>
          <Logo />
          <BotaoTema />
        </header>
        <main className="conteudo">{children}</main>
      </div>
    </div>
  );
}
