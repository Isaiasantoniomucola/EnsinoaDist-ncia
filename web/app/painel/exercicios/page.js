'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Alerta, Carregando, Etiqueta, TituloPagina, Vazio } from '@/components/ui';

export default function Exercicios() {
  const [aulas, setAulas] = useState(null);
  const [erro, setErro] = useState('');
  useEffect(() => { api('/aulas').then((l) => setAulas(l.filter((a) => a.total_exercicios > 0))).catch((e) => setErro(e.message)); }, []);

  return (
    <>
      <TituloPagina titulo="Exercícios" sub="Cada conjunto de exercícios só pode ser submetido uma vez." />
      <Alerta>{erro}</Alerta>
      {!aulas && !erro && <Carregando />}
      {aulas && aulas.length === 0 && <Vazio icone="exercicios" titulo="Ainda não há exercícios" texto="Quando os professores publicarem exercícios, vão aparecer aqui." />}
      {aulas && aulas.length > 0 && (
        <div className="tabela-wrap">
          <table className="tabela">
            <thead><tr><th>Módulo</th><th>Aula</th><th>Perguntas</th><th>Estado</th><th /></tr></thead>
            <tbody>
              {aulas.map((a) => (
                <tr key={a.id}>
                  <td data-label="Módulo">{a.capitulo}</td>
                  <td data-label="Aula"><b>{a.titulo}</b></td>
                  <td data-label="Perguntas">{a.total_exercicios}</td>
                  <td data-label="Estado">{a.pontuacao != null ? <Etiqueta tipo="ok">{a.pontuacao}/{a.total_resultado}</Etiqueta> : <Etiqueta tipo="aviso">Por fazer</Etiqueta>}</td>
                  <td className="acoes-td"><Link className={`botao botao-peq${a.pontuacao != null ? ' botao-sec' : ''}`} href={`/painel/exercicios/${a.id}`}>{a.pontuacao != null ? 'Ver resultado' : 'Fazer'}</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
