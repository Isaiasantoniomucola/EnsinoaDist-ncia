'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, percentagem } from '@/lib/api';
import { useSessao } from '@/components/AuthProvider';
import { Alerta, Barra, Carregando, Estatistica, Etiqueta, Vazio } from '@/components/ui';
import Icone from '@/components/Icones';

export default function PainelInicio() {
  const { sessao } = useSessao();
  const [aulas, setAulas] = useState(null);
  const [erro, setErro] = useState('');
  useEffect(() => { api('/aulas').then(setAulas).catch((e) => setErro(e.message)); }, []);

  const feitas = (aulas || []).filter((a) => a.pontuacao != null);
  const pendentes = (aulas || []).filter((a) => a.pontuacao == null && a.total_exercicios > 0);
  const media = percentagem(feitas.reduce((s, a) => s + a.pontuacao, 0), feitas.reduce((s, a) => s + a.total_resultado, 0));

  return (
    <>
      <section className="boasvindas">
        <h1>Olá, {sessao.utilizador.nome.split(' ')[0]}! 👋</h1>
        <p>Pronto para continuar a aprender? Veja o que tem à sua espera.</p>
      </section>
      <Alerta>{erro}</Alerta>
      {!aulas && !erro && <Carregando />}
      {aulas && (
        <>
          <div className="grelha">
            <Estatistica icone="livro" rotulo="Aulas disponíveis" valor={aulas.length} />
            <Estatistica icone="exercicios" rotulo="Exercícios concluídos" valor={feitas.length} tom="ok" />
            <div className="cartao">
              <div className="linha entre"><span className="suave">Média geral</span><Etiqueta tipo={feitas.length ? 'ok' : 'neutra'}>{feitas.length ? `${media}%` : 'Sem dados'}</Etiqueta></div>
              <span className="estat">{feitas.length ? `${media}%` : '—'}</span>
              <Barra valor={media} cor="ok" />
            </div>
          </div>

          <h2>Exercícios por fazer</h2>
          {pendentes.length === 0 ? (
            <Vazio icone="check" titulo="Está tudo em dia!" texto="Não tem exercícios pendentes neste momento." />
          ) : (
            <div className="grelha">
              {pendentes.slice(0, 6).map((a) => (
                <div className="cartao recurso" key={a.id}>
                  <Etiqueta>{a.capitulo}</Etiqueta>
                  <h3>{a.titulo}</h3>
                  <p className="suave">{a.total_exercicios} pergunta(s)</p>
                  <Link className="botao botao-peq" style={{ alignSelf: 'flex-start' }} href={`/painel/exercicios/${a.id}`}><Icone nome="exercicios" size={16} />Fazer exercícios</Link>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
