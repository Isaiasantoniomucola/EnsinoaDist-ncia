'use client';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import Icone from './Icones';

// Corre antes de a página aparecer, para não piscar branco quando o tema escuro está ativo.
export const scriptTema = "(function(){try{var t=localStorage.getItem('tema');if(t!=='claro'&&t!=='escuro'){t=matchMedia('(prefers-color-scheme: dark)').matches?'escuro':'claro'}document.documentElement.dataset.tema=t}catch(e){}})();";

const Ctx = createContext({ tema: 'claro', alternar: () => {} });

export function TemaProvider({ children }) {
  const [tema, setTema] = useState('claro');
  useEffect(() => { setTema(document.documentElement.dataset.tema === 'escuro' ? 'escuro' : 'claro'); }, []);

  const alternar = useCallback(() => {
    const novo = document.documentElement.dataset.tema === 'escuro' ? 'claro' : 'escuro';
    document.documentElement.dataset.tema = novo;
    try { localStorage.setItem('tema', novo); } catch { /* ignorar */ }
    setTema(novo);
  }, []);

  return <Ctx.Provider value={{ tema, alternar }}>{children}</Ctx.Provider>;
}

export const useTema = () => useContext(Ctx);

// comTexto: botão largo com legenda (barra lateral). Sem legenda: botão só com o ícone.
export function BotaoTema({ className = '', comTexto = false }) {
  const { tema, alternar } = useTema();
  const escuro = tema === 'escuro';
  const rotulo = escuro ? 'Modo claro' : 'Modo escuro';
  return (
    <button type="button" className={`botao-tema${comTexto ? ' com-texto' : ' icone-btn'} ${className}`} onClick={alternar} aria-label={`Mudar para ${rotulo.toLowerCase()}`} title={rotulo} aria-pressed={escuro}>
      <Icone nome={escuro ? 'sol' : 'lua'} size={comTexto ? 18 : 20} />
      {comTexto && rotulo}
    </button>
  );
}
