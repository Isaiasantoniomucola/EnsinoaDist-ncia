'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useSessao } from '@/components/AuthProvider';
import AuthLado from '@/components/AuthLado';
import { BotaoTema } from '@/components/Tema';
import { Alerta, Campo } from '@/components/ui';

export default function AdminEntrar() {
  const { entrar } = useSessao();
  const router = useRouter();
  const [f, setF] = useState({ email: '', senha: '' });
  const [erro, setErro] = useState('');
  const [a, setA] = useState(false);

  async function submeter(e) {
    e.preventDefault();
    setErro(''); setA(true);
    try {
      entrar(await api('/auth/admin/login', { metodo: 'POST', corpo: f, semRedirecionar: true }));
      router.push('/admin');
    } catch (err) { setErro(err.message); setA(false); }
  }

  return (
    <main className="auth-grid">
      <BotaoTema className="tema-flutuante" />
      <AuthLado titulo="Painel de administração" texto="Gira aulas, exercícios, alunos e acompanhe os resultados." itens={['Publique aulas em PDF e vídeo', 'Crie exercícios com correção automática', 'Acompanhe o desempenho dos alunos']} />
      <section className="auth-form">
        <form onSubmit={submeter}>
          <h1>Administração</h1>
          <p className="suave">Acesso reservado a administradores.</p>
          <Alerta>{erro}</Alerta>
          <Campo rotulo="E-mail" id="email" icone="email"><input id="email" type="email" autoComplete="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required /></Campo>
          <Campo rotulo="Palavra-passe" id="senha" icone="cadeado"><input id="senha" type="password" autoComplete="current-password" value={f.senha} onChange={(e) => setF({ ...f, senha: e.target.value })} required /></Campo>
          <button className="botao botao-bloco" disabled={a}>{a ? 'A entrar…' : 'Entrar'}</button>
          <p className="auth-rodape">Ainda não tem conta de administrador? <Link href="/admin/registo">Criar conta</Link></p>
          <p className="auth-rodape" style={{ marginTop: '.4rem' }}><Link href="/">← Voltar ao site</Link></p>
        </form>
      </section>
    </main>
  );
}
