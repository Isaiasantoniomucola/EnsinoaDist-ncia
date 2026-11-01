import React, { createContext, useContext, useEffect, useState } from 'react';
import { carregarSessao, definirAoExpirar, guardarSessao, limparSessao } from './api';

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [sessao, setSessao] = useState(null);
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    definirAoExpirar(() => setSessao(null));
    carregarSessao().then((s) => { setSessao(s); setPronto(true); });
  }, []);

  const entrar = async (dados) => { await guardarSessao(dados); setSessao(dados); };
  const sair = async () => { await limparSessao(); setSessao(null); };

  return <Ctx.Provider value={{ sessao, pronto, entrar, sair }}>{children}</Ctx.Provider>;
}

export const useSessao = () => useContext(Ctx);
