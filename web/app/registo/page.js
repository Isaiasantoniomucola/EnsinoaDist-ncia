'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useSessao } from '@/components/AuthProvider';
import AuthLado from '@/components/AuthLado';
import { BotaoTema } from '@/components/Tema';
import { Alerta, Campo } from '@/components/ui';

export default function Registo() {
  const { entrar } = useSessao();
  const router = useRouter();
  const [f, setF] = useState({ nome: '', apelido: '', email: '', telefone: '', senha: '', confirmar: '' });
  const [erro, setErro] = useState('');
  const [a, setA] = useState(false);
  const mudar = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submeter(e) {
    e.preventDefault();
    if (f.senha !== f.confirmar) return setErro('A confirmação não coincide com a palavra-passe.');
    setErro(''); setA(true);
    try {
      const { confirmar, ...corpo } = f;
      entrar(await api('/auth/registo', { metodo: 'POST', corpo, semRedirecionar: true }));
      router.push('/painel');
    } catch (err) { setErro(err.message); setA(false); }
  }

  return (
    <main className="auth-grid">
      <BotaoTema className="tema-flutuante" />
      <AuthLado titulo="Crie a sua conta" texto="Basta o seu e-mail para começar a aprender." itens={['Registo gratuito e rápido', 'Acesso em qualquer dispositivo', 'Acompanhe o seu progresso']} />
      <section className="auth-form">
        <form onSubmit={submeter}>
          <h1>Criar conta</h1>
          <p className="suave">Preencha os seus dados. Usará o e-mail para entrar.</p>
          <Alerta>{erro}</Alerta>
          <div className="form-grelha">
            <Campo rotulo="Nome" id="nome"><input id="nome" autoComplete="given-name" value={f.nome} onChange={mudar('nome')} required /></Campo>
            <Campo rotulo="Apelido" id="apelido"><input id="apelido" autoComplete="family-name" value={f.apelido} onChange={mudar('apelido')} required /></Campo>
          </div>
          <Campo rotulo="E-mail" id="email" icone="email"><input id="email" type="email" autoComplete="email" inputMode="email" placeholder="nome@exemplo.com" value={f.email} onChange={mudar('email')} required /></Campo>
          <Campo rotulo="Telefone (opcional)" id="telefone" icone="telefone"><input id="telefone" type="tel" autoComplete="tel" value={f.telefone} onChange={mudar('telefone')} /></Campo>
          <div className="form-grelha">
            <Campo rotulo="Palavra-passe" id="senha" icone="cadeado" dica="Mínimo de 8 caracteres, com letras e números"><input id="senha" type="password" autoComplete="new-password" minLength={8} value={f.senha} onChange={mudar('senha')} required /></Campo>
            <Campo rotulo="Confirmar palavra-passe" id="confirmar" icone="cadeado"><input id="confirmar" type="password" autoComplete="new-password" minLength={8} value={f.confirmar} onChange={mudar('confirmar')} required /></Campo>
          </div>
          <button className="botao botao-bloco" disabled={a}>{a ? 'A criar conta…' : 'Criar conta'}</button>
          <p className="auth-rodape">Já tem conta? <Link href="/entrar">Iniciar sessão</Link></p>
        </form>
      </section>
    </main>
  );
}
