'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { useSessao } from './AuthProvider';
import { Alerta, Campo } from './ui';

export default function FormSenha() {
  const { sessao, entrar } = useSessao();
  const admin = sessao?.utilizador.tipo !== 'aluno';
  const min = admin ? 10 : 8;
  const [f, setF] = useState({ senha_atual: '', nova_senha: '', confirmar: '' });
  const [msg, setMsg] = useState({ tipo: 'erro', texto: '' });
  const [a, setA] = useState(false);
  const mudar = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submeter(e) {
    e.preventDefault();
    if (f.nova_senha !== f.confirmar) return setMsg({ tipo: 'erro', texto: 'A confirmação não coincide com a nova palavra-passe.' });
    setA(true); setMsg({ tipo: 'erro', texto: '' });
    try {
      const r = await api('/auth/senha', { metodo: 'PUT', corpo: { senha_atual: f.senha_atual, nova_senha: f.nova_senha }, semRedirecionar: true });
      entrar({ token: r.token, utilizador: sessao.utilizador }); // as sessões antigas deixam de valer
      setF({ senha_atual: '', nova_senha: '', confirmar: '' });
      setMsg({ tipo: 'ok', texto: 'Palavra-passe alterada com sucesso.' });
    } catch (err) { setMsg({ tipo: 'erro', texto: err.message }); }
    setA(false);
  }

  return (
    <form className="cartao" onSubmit={submeter} style={{ maxWidth: 520 }}>
      <h3>Alterar palavra-passe</h3>
      <p className="suave">{admin ? 'Mínimo de 10 caracteres, com maiúsculas, minúsculas e números.' : 'Mínimo de 8 caracteres, com letras e números.'}</p>
      <Alerta tipo={msg.tipo}>{msg.texto}</Alerta>
      <Campo rotulo="Palavra-passe atual" id="atual" icone="cadeado"><input id="atual" type="password" autoComplete="current-password" value={f.senha_atual} onChange={mudar('senha_atual')} required /></Campo>
      <Campo rotulo="Nova palavra-passe" id="nova" icone="cadeado"><input id="nova" type="password" autoComplete="new-password" minLength={min} value={f.nova_senha} onChange={mudar('nova_senha')} required /></Campo>
      <Campo rotulo="Confirmar nova palavra-passe" id="conf" icone="cadeado"><input id="conf" type="password" autoComplete="new-password" minLength={min} value={f.confirmar} onChange={mudar('confirmar')} required /></Campo>
      <button className="botao" disabled={a}>{a ? 'A guardar…' : 'Guardar palavra-passe'}</button>
    </form>
  );
}
