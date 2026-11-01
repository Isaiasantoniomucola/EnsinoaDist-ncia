import React, { useState } from 'react';
import { api } from '../api';
import { useSessao } from '../auth';
import { Botao, Campo, Ecra, Erro } from '../ui';

export default function Registo() {
  const { entrar } = useSessao();
  const [f, setF] = useState({ nome: '', apelido: '', email: '', telefone: '', senha: '', confirmar: '' });
  const [erro, setErro] = useState('');
  const [a, setA] = useState(false);
  const mudar = (k) => (v) => setF({ ...f, [k]: v });

  async function submeter() {
    if (f.senha !== f.confirmar) return setErro('A confirmação não coincide com a palavra-passe.');
    setErro(''); setA(true);
    try {
      const { confirmar, ...corpo } = f;
      await entrar(await api('/auth/registo', { metodo: 'POST', corpo, semExpirar: true }));
    } catch (e) { setErro(e.message); setA(false); }
  }

  const invalido = !f.nome || !f.apelido || !f.email || f.senha.length < 8 || !f.confirmar;

  return (
    <Ecra>
      <Erro texto={erro} />
      <Campo rotulo="Nome" value={f.nome} onChangeText={mudar('nome')} autoCapitalize="words" />
      <Campo rotulo="Apelido" value={f.apelido} onChangeText={mudar('apelido')} autoCapitalize="words" />
      <Campo rotulo="E-mail" value={f.email} onChangeText={mudar('email')} keyboardType="email-address" autoComplete="email" placeholder="nome@exemplo.com" />
      <Campo rotulo="Telefone (opcional)" value={f.telefone} onChangeText={mudar('telefone')} keyboardType="phone-pad" />
      <Campo rotulo="Palavra-passe (mín. 8, letras e números)" value={f.senha} onChangeText={mudar('senha')} secureTextEntry />
      <Campo rotulo="Confirmar palavra-passe" value={f.confirmar} onChangeText={mudar('confirmar')} secureTextEntry />
      <Botao texto="Criar conta" onPress={submeter} carregando={a} desativado={invalido} />
    </Ecra>
  );
}
