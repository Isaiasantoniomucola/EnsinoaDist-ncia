'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useSessao } from '@/components/AuthProvider';
import AuthLado from '@/components/AuthLado';
import { BotaoTema } from '@/components/Tema';
import { Alerta, Campo } from '@/components/ui';

export default function Entrar() {
  const { entrar } = useSessao();
  const router = useRouter();
  const [f, setF] = useState({ email: '', senha: '' });
  const [erro, setErro] = useState('');
  const [a, setA] = useState(false);

  async function submeter(e) {
    e.preventDefault();
    setErro(''); setA(true);
    try {
      entrar(await api('/auth/login', { metodo: 'POST', corpo: f, semRedirecionar: true }));
      router.push('/painel');
    } catch (err) { setErro(err.message); setA(false); }
  }

  return (
    <main className="auth-grid">
      <BotaoTema className="tema-flutuante" />
      <AuthLado titulo="Bem-vindo de volta" texto="Continue os seus estudos de onde parou." itens={['Aulas em vídeo e PDF', 'Exercícios com correção automática', 'Resultados sempre à mão']} />
      <section className="auth-form">
        <form onSubmit={submeter}>
          <h1>Iniciar sessão</h1>
          <p className="suave">Entre com o seu e-mail e palavra-passe.</p>
          <Alerta>{erro}</Alerta>
          <Campo rotulo="E-mail" id="email" icone="email">
            <input id="email" type="email" autoComplete="email" inputMode="email" placeholder="nome@exemplo.com" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required />
          </Campo>
          <Campo rotulo="Palavra-passe" id="senha" icone="cadeado">
            <input id="senha" type="password" autoComplete="current-password" value={f.senha} onChange={(e) => setF({ ...f, senha: e.target.value })} required />
          </Campo>
          <button className="botao botao-bloco" disabled={a}>{a ? 'A entrar…' : 'Entrar'}</button>
          <p className="auth-rodape">Ainda não tem conta? <Link href="/registo">Criar conta</Link></p>
        </form>
      </section>
    </main>
  );
}
