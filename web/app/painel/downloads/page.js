'use client';
import { useEffect, useState } from 'react';
import { abrirFicheiro, api } from '@/lib/api';
import Icone from '@/components/Icones';
import { Alerta, Carregando, Etiqueta, TituloPagina, Vazio } from '@/components/ui';

export default function Downloads() {
  const [aulas, setAulas] = useState(null);
  const [erro, setErro] = useState('');
  useEffect(() => { api('/aulas').then((l) => setAulas(l.filter((a) => a.tem_ficheiro))).catch((e) => setErro(e.message)); }, []);

  return (
    <>
      <TituloPagina titulo="Downloads" sub="Descarregue os materiais das aulas para estudar offline." />
      <Alerta>{erro}</Alerta>
      {!aulas && !erro && <Carregando />}
      {aulas && aulas.length === 0 && <Vazio icone="download" titulo="Sem ficheiros disponíveis" texto="Os materiais das aulas vão aparecer aqui." />}
      {aulas && aulas.length > 0 && (
        <div className="tabela-wrap">
          <table className="tabela">
            <thead><tr><th>Tipo</th><th>Módulo</th><th>Aula</th><th /></tr></thead>
            <tbody>
              {aulas.map((a) => (
                <tr key={a.id}>
                  <td data-label="Tipo"><Etiqueta tipo={a.categoria === 'video' ? '' : 'aviso'}>{a.categoria === 'video' ? 'Vídeo' : 'PDF'}</Etiqueta></td>
                  <td data-label="Módulo">{a.capitulo}</td>
                  <td data-label="Aula"><b>{a.titulo}</b></td>
                  <td className="acoes-td"><button className="botao botao-peq" onClick={() => abrirFicheiro(a.id, true).catch((e) => setErro(e.message))}><Icone nome="download" size={16} />Descarregar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
