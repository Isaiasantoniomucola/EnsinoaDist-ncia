'use client';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Icone from '@/components/Icones';
import Modal from '@/components/Modal';
import { Alerta, Campo, Carregando, Etiqueta, TituloPagina, Vazio } from '@/components/ui';

const vazio = { id: null, aula_id: '', pergunta: '', opcao_a: '', opcao_b: '', opcao_c: '', opcao_d: '', resposta: 'A' };

export default function AdminExercicios() {
  const [aulas, setAulas] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [lista, setLista] = useState(null);
  const [form, setForm] = useState(null);
  const [msg, setMsg] = useState({ tipo: 'erro', texto: '' });
  const [modalErro, setModalErro] = useState('');

  useEffect(() => { api('/admin/aulas').then(setAulas).catch((e) => setMsg({ tipo: 'erro', texto: e.message })); }, []);
  const carregar = useCallback(() => api(`/admin/exercicios${filtro ? `?aula_id=${filtro}` : ''}`).then(setLista).catch((e) => setMsg({ tipo: 'erro', texto: e.message })), [filtro]);
  useEffect(() => { carregar(); }, [carregar]);

  const mudar = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function guardar(e) {
    e.preventDefault();
    setModalErro('');
    try {
      await api(form.id ? `/admin/exercicios/${form.id}` : '/admin/exercicios', { metodo: form.id ? 'PUT' : 'POST', corpo: form });
      setForm(null); setMsg({ tipo: 'ok', texto: 'Exercício guardado.' }); carregar();
    } catch (err) { setModalErro(err.message); }
  }

  async function eliminar(x) {
    if (!window.confirm('Eliminar este exercício?')) return;
    try { await api(`/admin/exercicios/${x.id}`, { metodo: 'DELETE' }); carregar(); }
    catch (err) { setMsg({ tipo: 'erro', texto: err.message }); }
  }

  return (
    <>
      <TituloPagina titulo="Exercícios" sub="Perguntas de escolha múltipla por aula.">
        <button className="botao" onClick={() => { setModalErro(''); setForm({ ...vazio, aula_id: filtro || aulas[0]?.id || '' }); }} disabled={!aulas.length}><Icone nome="mais" size={18} />Novo exercício</button>
      </TituloPagina>
      <Alerta tipo={msg.tipo}>{msg.texto}</Alerta>
      {!aulas.length && <p className="suave">Crie primeiro uma aula para poder adicionar exercícios.</p>}

      <div className="ferramentas">
        <select value={filtro} onChange={(e) => setFiltro(e.target.value)} aria-label="Filtrar por aula" style={{ maxWidth: 420 }}>
          <option value="">Todas as aulas</option>
          {aulas.map((a) => <option key={a.id} value={a.id}>{a.capitulo} — {a.titulo}</option>)}
        </select>
      </div>

      {!lista && <Carregando />}
      {lista && lista.length === 0 && <Vazio icone="exercicios" titulo="Sem exercícios" texto="Adicione perguntas para os alunos praticarem." />}
      {lista && lista.length > 0 && (
        <div className="tabela-wrap">
          <table className="tabela">
            <thead><tr><th>Aula</th><th>Pergunta</th><th>Correta</th><th /></tr></thead>
            <tbody>
              {lista.map((x) => (
                <tr key={x.id}>
                  <td data-label="Aula">{x.aula_titulo}</td>
                  <td data-label="Pergunta">{x.pergunta}</td>
                  <td data-label="Correta"><Etiqueta tipo="ok">{x.resposta}</Etiqueta></td>
                  <td className="acoes-td"><div className="acoes">
                    <button className="botao botao-sec botao-peq" onClick={() => { setModalErro(''); setForm({ ...x }); }}><Icone nome="editar" size={16} />Editar</button>
                    <button className="botao botao-perigo botao-peq" onClick={() => eliminar(x)}><Icone nome="lixo" size={16} />Eliminar</button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {form && (
        <Modal titulo={form.id ? 'Editar exercício' : 'Novo exercício'} onFechar={() => setForm(null)}>
          <form onSubmit={guardar}>
            <Alerta>{modalErro}</Alerta>
            <Campo rotulo="Aula" id="aula">
              <select id="aula" value={form.aula_id} onChange={mudar('aula_id')} required>
                {aulas.map((a) => <option key={a.id} value={a.id}>{a.capitulo} — {a.titulo}</option>)}
              </select>
            </Campo>
            <Campo rotulo="Pergunta" id="pergunta"><textarea id="pergunta" value={form.pergunta} onChange={mudar('pergunta')} required /></Campo>
            <div className="form-grelha">
              {['a', 'b', 'c', 'd'].map((l) => (
                <Campo key={l} rotulo={`Opção ${l.toUpperCase()}`} id={`o${l}`}><input id={`o${l}`} value={form[`opcao_${l}`]} onChange={mudar(`opcao_${l}`)} required /></Campo>
              ))}
            </div>
            <Campo rotulo="Resposta correta" id="resposta">
              <select id="resposta" value={form.resposta} onChange={mudar('resposta')}>
                {['A', 'B', 'C', 'D'].map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </Campo>
            <div className="modal-rodape">
              <button type="button" className="botao botao-sec" onClick={() => setForm(null)}>Cancelar</button>
              <button className="botao">Guardar</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
