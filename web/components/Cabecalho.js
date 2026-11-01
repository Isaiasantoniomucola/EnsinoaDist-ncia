'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import Icone from './Icones';
import Logo from './Logo';
import { Avatar } from './ui';
import { BotaoTema } from './Tema';

export default function Cabecalho({ links, nome, onSair }) {
  const caminho = usePathname();
  const [aberto, setAberto] = useState(false);
  const ativo = (href) => (href === links[0].href ? caminho === href : caminho.startsWith(href));

  return (
    <header className="topo">
      <div className="contentor topo-in">
        <Link href={links[0].href} aria-label="Início"><Logo /></Link>
        <BotaoTema />
        <button className="icone-btn hamb" aria-label="Abrir menu" aria-expanded={aberto} onClick={() => setAberto(!aberto)}>
          <Icone nome={aberto ? 'fechar' : 'menu'} />
        </button>
        <nav className={`menu${aberto ? ' aberto' : ''}`} onClick={() => setAberto(false)}>
          {links.map((l) => (
            <Link key={l.href} href={l.href} className={ativo(l.href) ? 'ativo' : ''}><Icone nome={l.icone} size={18} />{l.texto}</Link>
          ))}
          <span className="menu-sep" />
          <span className="menu-utilizador"><Avatar nome={nome} /><span>{nome?.split(' ')[0]}</span></span>
          <button onClick={onSair}><Icone nome="sair" size={18} />Sair</button>
        </nav>
      </div>
    </header>
  );
}
