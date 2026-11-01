'use client';
import { usePathname } from 'next/navigation';
import Protegido from '@/components/Protegido';
import Lateral from '@/components/Lateral';
import { useSessao } from '@/components/AuthProvider';

function Estrutura({ children }) {
  const { sessao, sair } = useSessao();
  const links = [
    { href: '/admin', texto: 'Painel', icone: 'grafico' },
    { href: '/admin/aulas', texto: 'Aulas', icone: 'livro' },
    { href: '/admin/exercicios', texto: 'Exercícios', icone: 'exercicios' },
    { href: '/admin/alunos', texto: 'Alunos', icone: 'utilizadores' },
    { href: '/admin/utilizadores', texto: 'Administradores', icone: 'escudo' },
    { href: '/admin/conta', texto: 'A minha conta', icone: 'utilizador' },
  ];
  return <Lateral links={links} nome={sessao?.utilizador.nome} perfil={sessao?.utilizador.tipo} onSair={sair}>{children}</Lateral>;
}

export default function AdminLayout({ children }) {
  const caminho = usePathname();
  if (caminho === '/admin/entrar' || caminho === '/admin/registo') return children;
  return (
    <Protegido tipos={['administrador']} entrada="/admin/entrar">
      <Estrutura>{children}</Estrutura>
    </Protegido>
  );
}
