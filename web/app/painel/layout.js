'use client';
import Protegido from '@/components/Protegido';
import Cabecalho from '@/components/Cabecalho';
import { useSessao } from '@/components/AuthProvider';

const links = [
  { href: '/painel', texto: 'Início', icone: 'casa' },
  { href: '/painel/aulas', texto: 'Aulas', icone: 'livro' },
  { href: '/painel/exercicios', texto: 'Exercícios', icone: 'exercicios' },
  { href: '/painel/downloads', texto: 'Downloads', icone: 'download' },
  { href: '/painel/sobre', texto: 'Sobre', icone: 'escudo' },
  { href: '/painel/conta', texto: 'Conta', icone: 'utilizador' },
];

function Estrutura({ children }) {
  const { sessao, sair } = useSessao();
  return (
    <>
      <Cabecalho links={links} nome={sessao?.utilizador.nome} onSair={sair} />
      <main className="contentor pagina">{children}</main>
    </>
  );
}

export default function PainelLayout({ children }) {
  return <Protegido tipos={['aluno']} entrada="/entrar"><Estrutura>{children}</Estrutura></Protegido>;
}
