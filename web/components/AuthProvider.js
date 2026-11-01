'use client';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { guardarSessao, lerSessao, limparSessao } from '@/lib/api';

const Ctx = createContext(null);
const INATIVIDADE_ADMIN_MS = 30 * 60 * 1000; // a administração fecha sozinha após 30 min sem uso

export function AuthProvider({ children }) {
  const [sessao, setSessao] = useState(null);
  const [pronto, setPronto] = useState(false);
  const ultimaAcao = useRef(Date.now());

  useEffect(() => { setSessao(lerSessao()); setPronto(true); }, []);

  const entrar = useCallback((dados) => { guardarSessao(dados); setSessao(dados); ultimaAcao.current = Date.now(); }, []);
  const sair = useCallback(() => { limparSessao(); setSessao(null); }, []);

  // Terminar a sessão de administrador por inatividade.
  const admin = !!sessao && sessao.utilizador.tipo !== 'aluno';
  useEffect(() => {
    if (!admin) return undefined;
    const marcar = () => { ultimaAcao.current = Date.now(); };
    const eventos = ['pointerdown', 'keydown', 'scroll', 'touchstart'];
    eventos.forEach((e) => window.addEventListener(e, marcar, { passive: true }));
    const relogio = setInterval(() => {
      if (Date.now() - ultimaAcao.current > INATIVIDADE_ADMIN_MS) { limparSessao(); setSessao(null); }
    }, 30000);
    return () => { eventos.forEach((e) => window.removeEventListener(e, marcar)); clearInterval(relogio); };
  }, [admin]);

  return <Ctx.Provider value={{ sessao, pronto, entrar, sair }}>{children}</Ctx.Provider>;
}

export const useSessao = () => useContext(Ctx);
