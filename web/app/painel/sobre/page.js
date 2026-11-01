import Icone from '@/components/Icones';
import { TituloPagina } from '@/components/ui';

const blocos = [
  { icone: 'escudo', t: 'Missão', x: 'Proporcionar ensino de qualidade, acessível a todos, através de conteúdos digitais claros e exercícios que consolidam o conhecimento.' },
  { icone: 'grafico', t: 'Visão', x: 'Ser uma referência em ensino a distância, preparando os alunos com as competências de que precisam para o futuro.' },
  { icone: 'check', t: 'Valores', x: 'Rigor, excelência e compromisso com o sucesso de cada aluno.' },
];

export default function Sobre() {
  return (
    <>
      <TituloPagina titulo="Sobre o EaD" sub="Ensino a Distância" />
      <div className="grelha">
        {blocos.map((b) => (
          <section className="cartao recurso" key={b.t}>
            <span className="stat-icone"><Icone nome={b.icone} size={22} /></span>
            <h3>{b.t}</h3>
            <p className="suave" style={{ margin: 0 }}>{b.x}</p>
          </section>
        ))}
      </div>
      <p className="suave mt">
        EaD- plataforma de ensino a distância.
      </p>
    </>
  );
}
