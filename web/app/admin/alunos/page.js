'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, formatarData, percentagem } from '@/lib/api';
import Icone from '@/components/Icones';
import Modal from '@/components/Modal';
import { Alerta, Avatar, Carregando, Etiqueta, TituloPagina, Vazio } from '@/components/ui';

export default function AdminAlunos() {
  const [lista, setLista] = useState(null);
  const [detalhe, setDetalhe] = useState(null);
  const [busca, setBusca] = useState('');
  const [msg, setMsg] = useState({ tipo: 'erro', texto: '' });

  const carregar = useCallback(() => api('/admin/alunos').then(setLista).catch((e) => setMsg({ tipo: 'erro', texto: e.message })), []);
  useEffect(() => { carregar(); }, [carregar]);

  const filtrada = useMemo(() => (lista || []).filter((a) => `${a.nome} ${a.apelido} ${a.email}`.toLowerCase().includes(busca.toLowerCase())), [lista, busca]);
  const ver = (id) => api(`/admin/alunos/${id}`).then(setDetalhe).catch((e) => setMsg({ tipo: 'erro', texto: e.message }));

  async function repor(aulaId) {
    if (!window.confirm('Permitir que o aluno repita os exercícios desta aula? O resultado atual será apagado.')) return;
    try { await api(`/admin/alunos/${detalhe.id}/resultados/${aulaId}`, { metodo: 'DELETE' }); await ver(detalhe.id); carregar(); }
    catch (err) { setMsg({ tipo: 'erro', texto: err.message }); }
  }

  async function eliminar(al) {
    if (!window.confirm(`Eliminar o aluno ${al.nome} ${al.apelido} e todos os seus resultados?`)) return;
    try { await api(`/admin/alunos/${al.id}`, { metodo: 'DELETE' }); setDetalhe(null); setMsg({ tipo: 'ok', texto: 'Aluno eliminado.' }); carregar(); }
    catch (err) { setMsg({ tipo: 'erro', texto: err.message }); }
  }

  return (
    <>
      <TituloPagina titulo="Alunos" sub={lista ? `${lista.length} aluno(s) registado(s)` : ''} />
      <Alerta tipo={msg.tipo}>{msg.texto}</Alerta>
      <div className="ferramentas"><div className="pesquisa"><Icone nome="pesquisa" size={18} /><input type="search" placeholder="Pesquisar por nome ou e-mail…" value={busca} onChange={(e) => setBusca(e.target.value)} aria-label="Pesquisar alunos" /></div></div>

      {!lista && <Carregando />}
      {lista && filtrada.length === 0 && <Vazio icone="utilizadores" titulo="Nenhum aluno encontrado" />}
      {filtrada.length > 0 && (
        <div className="tabela-wrap">
          <table className="tabela">
            <thead><tr><th>Aluno</th><th>Telefone</th><th>Registo</th><th>Exercícios feitos</th><th /></tr></thead>
            <tbody>
              {filtrada.map((al) => (
                <tr key={al.id}>
                  <td data-label="Aluno"><div className="pessoa"><Avatar nome={`${al.nome} ${al.apelido}`} /><div><b>{al.nome} {al.apelido}</b><small>{al.email}</small></div></div></td>
                  <td data-label="Telefone">{al.telefone || '—'}</td>
                  <td data-label="Registo">{formatarData(al.criado_em)}</td>
                  <td data-label="Exercícios feitos"><Etiqueta tipo={al.aulas_concluidas ? 'ok' : 'neutra'}>{al.aulas_concluidas}</Etiqueta></td>
                  <td className="acoes-td"><div className="acoes">
                    <button className="botao botao-sec botao-peq" onClick={() => ver(al.id)}>Detalhes</button>
                    <button className="botao botao-perigo botao-peq" onClick={() => eliminar(al)}><Icone nome="lixo" size={16} />Eliminar</button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {detalhe && (
        <Modal titulo="Detalhes do aluno" onFechar={() => setDetalhe(null)} largura={720}>
          <div className="pessoa" style={{ marginBottom: '1rem' }}>
            <Avatar nome={`${detalhe.nome} ${detalhe.apelido}`} />
            <div><b>{detalhe.nome} {detalhe.apelido}</b><small>{detalhe.email} · {detalhe.telefone || 'sem telefone'}</small></div>
          </div>
          <div className="tabela-wrap">
            <table className="tabela">
              <thead><tr><th>Aula</th><th>Pontuação</th><th>Data</th><th /></tr></thead>
              <tbody>
                {detalhe.resultados.length === 0 && <tr><td colSpan="4" className="suave">Ainda não submeteu exercícios.</td></tr>}
                {detalhe.resultados.map((r) => (
                  <tr key={r.aula_id}>
                    <td data-label="Aula">{r.capitulo} — {r.titulo}</td>
                    <td data-label="Pontuação">{r.pontuacao}/{r.total} ({percentagem(r.pontuacao, r.total)}%)</td>
                    <td data-label="Data">{formatarData(r.submetido_em)}</td>
                    <td className="acoes-td"><button className="botao botao-sec botao-peq" onClick={() => repor(r.aula_id)}>Permitir repetir</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Modal>
      )}
    </>
  );
}
