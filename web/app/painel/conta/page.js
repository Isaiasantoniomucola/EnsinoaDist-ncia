'use client';
import { useSessao } from '@/components/AuthProvider';
import FormSenha from '@/components/FormSenha';
import { Avatar, TituloPagina } from '@/components/ui';

export default function Conta() {
  const { sessao } = useSessao();
  const u = sessao.utilizador;
  return (
    <>
      <TituloPagina titulo="A minha conta" sub="Dados de acesso e segurança." />
      <div className="cartao pessoa" style={{ maxWidth: 520, marginBottom: '1.1rem' }}>
        <Avatar nome={u.nome} />
        <div><b>{u.nome}</b><small>{u.email}</small></div>
      </div>
      <FormSenha />
    </>
  );
}
