'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useSessao } from '@/components/AuthProvider';
import AuthLado from '@/components/AuthLado';
import { BotaoTema } from '@/components/Tema';
import { Alerta, Campo } from '@/components/ui';

export default function AdminRegisto() {
  const { entrar } = useSessao();
  const router = useRouter();
  const [f, setF] = useState({ nome: '', email: '', senha: '', confirmar: '', codigo: '' });
  const [ativo, setAtivo] = useState(null); // o servidor tem ADMIN_CODIGO definido?
  const [erro, setErro] = useState('');
  const [a, setA] = useState(false);
  const mudar = (k) => (e) => setF({ ...f, [k]: e.target.value });

  useEffect(() => { api('/auth/admin/registo-ativo', { semRedirecionar: true }).then((r) => setAtivo(r.ativo)).catch(() => setAtivo(false)); }, []);

  async function submeter(e) {
    e.preventDefault();
    if (f.senha !== f.confirmar) return setErro('A confirmação não coincide com a palavra-passe.');
    setErro(''); setA(true);
    try {
      const { confirmar, ...corpo } = f;
      entrar(await api('/auth/admin/registo', { metodo: 'POST', corpo, semRedirecionar: true }));
      router.push('/admin');
    } catch (err) { setErro(err.message); setA(false); }
  }

  return (
    <main className="auth-grid">
      <BotaoTema className="tema-flutuante" />
      <AuthLado titulo="Conta de administrador" texto="Só quem tem o código de autorização do servidor pode criar uma conta de administrador." itens={['Acesso exclusivo à administração', 'Palavra-passe forte obrigatória', 'Sessão curta e protegida']} />
      <section className="auth-form">
        <form onSubmit={submeter}>
          <h1>Criar administrador</h1>
          <p className="suave">Preencha os dados e o código de autorização definido no servidor (<code>ADMIN_CODIGO</code>).</p>
          {ativo === false && <Alerta>O registo de administradores está desativado. O dono do servidor tem de definir <b>ADMIN_CODIGO</b> (mín. 12 caracteres) no ficheiro .env do backend e reiniciar a API.</Alerta>}
          <Alerta>{erro}</Alerta>
          <Campo rotulo="Nome" id="nome"><input id="nome" autoComplete="name" value={f.nome} onChange={mudar('nome')} required maxLength={90} /></Campo>
          <Campo rotulo="E-mail" id="email" icone="email"><input id="email" type="email" autoComplete="email" inputMode="email" value={f.email} onChange={mudar('email')} required /></Campo>
          <div className="form-grelha">
            <Campo rotulo="Palavra-passe" id="senha" icone="cadeado" dica="Mín. 10 caracteres, com maiúsculas, minúsculas e números"><input id="senha" type="password" autoComplete="new-password" minLength={10} maxLength={72} value={f.senha} onChange={mudar('senha')} required /></Campo>
            <Campo rotulo="Confirmar palavra-passe" id="confirmar" icone="cadeado"><input id="confirmar" type="password" autoComplete="new-password" minLength={10} maxLength={72} value={f.confirmar} onChange={mudar('confirmar')} required /></Campo>
          </div>
          <Campo rotulo="Código de autorização" id="codigo" icone="escudo"><input id="codigo" type="password" autoComplete="off" value={f.codigo} onChange={mudar('codigo')} required /></Campo>
          <button className="botao botao-bloco" disabled={a || ativo === false}>{a ? 'A criar…' : 'Criar conta de administrador'}</button>
          <p className="auth-rodape">Já tem conta? <Link href="/admin/entrar">Entrar</Link></p>
        </form>
      </section>
    </main>
  );
}
