'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api, percentagem } from '@/lib/api';
import Icone from '@/components/Icones';
import { Alerta, Barra, Carregando } from '@/components/ui';

export default function Quiz() {
  const { id } = useParams();
  const [dados, setDados] = useState(null);
  const [resp, setResp] = useState({});
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  const carregar = useCallback(() => api(`/aulas/${id}/exercicios`).then(setDados).catch((e) => setErro(e.message)), [id]);
  useEffect(() => { carregar(); }, [carregar]);

  async function enviar() {
    const falta = dados.exercicios.length - Object.keys(resp).length;
    const aviso = falta > 0 ? `Tem ${falta} pergunta(s) sem resposta. ` : '';
    if (!window.confirm(`${aviso}Só pode submeter uma vez. Deseja submeter agora?`)) return;
    setEnviando(true); setErro('');
    try {
      await api(`/aulas/${id}/submeter`, { metodo: 'POST', corpo: { respostas: resp } });
      await carregar();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) { setErro(e.message); }
    setEnviando(false);
  }

  if (!dados) return erro ? <Alerta>{erro}</Alerta> : <Carregando />;
  const { aula, exercicios, resultado } = dados;
  const respondidas = Object.keys(resp).length;

  return (
    <>
      <Link href="/painel/exercicios" className="voltar"><Icone nome="voltar" size={18} />Voltar aos exercícios</Link>
      <h1>{aula.titulo}</h1>
      <p className="suave">{aula.capitulo}</p>
      <Alerta>{erro}</Alerta>

      {resultado && (
        <div className="cartao" style={{ marginBottom: '1.5rem' }}>
          <span className="suave">A sua pontuação</span>
          <div className="pontuacao">{resultado.pontuacao} / {resultado.total} <span className="suave" style={{ fontSize: '1.1rem', fontWeight: 600 }}>({percentagem(resultado.pontuacao, resultado.total)}%)</span></div>
          <Barra valor={percentagem(resultado.pontuacao, resultado.total)} cor="ok" />
        </div>
      )}
      {exercicios.length === 0 && <p className="suave">Esta aula ainda não tem exercícios.</p>}

      {exercicios.map((q, i) => (
        <fieldset key={q.id} className="cartao q-cartao" style={{ margin: '0 0 1.1rem' }}>
          <legend style={{ display: 'none' }}>Pergunta {i + 1}</legend>
          <p style={{ fontWeight: 700, margin: 0 }}><span className="q-num">{i + 1}</span>{q.pergunta}</p>
          {['A', 'B', 'C', 'D'].map((letra) => {
            let classe = 'opcao';
            if (resultado) {
              if (letra === q.resposta_correta) classe += ' certa';
              else if (letra === q.escolha) classe += ' errada';
            } else if (resp[q.id] === letra) classe += ' sel';
            return (
              <label key={letra} className={classe}>
                <input type="radio" name={`q${q.id}`} value={letra} disabled={!!resultado}
                  checked={resultado ? q.escolha === letra : resp[q.id] === letra}
                  onChange={() => setResp({ ...resp, [q.id]: letra })} />
                <span><strong>{letra}.</strong> {q.opcoes[letra]}</span>
              </label>
            );
          })}
          {resultado && <p className="suave" style={{ margin: '.7rem 0 0' }}>{q.correta ? '✅ Correto' : q.escolha ? `❌ Incorreto — resposta certa: ${q.resposta_correta}` : `⚠ Sem resposta — resposta certa: ${q.resposta_correta}`}</p>}
        </fieldset>
      ))}

      {!resultado && exercicios.length > 0 && (
        <div className="barra-envio">
          <div className="linha entre">
            <div style={{ flex: 1, minWidth: 160 }}><span className="suave">{respondidas} de {exercicios.length} respondidas</span><Barra valor={percentagem(respondidas, exercicios.length)} /></div>
            <button className="botao" onClick={enviar} disabled={enviando}>{enviando ? 'A submeter…' : 'Submeter respostas'}</button>
          </div>
        </div>
      )}
    </>
  );
}
