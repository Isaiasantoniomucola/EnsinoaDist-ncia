'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { abrirFicheiro, api } from '@/lib/api';
import Icone from '@/components/Icones';
import Modal from '@/components/Modal';
import { Alerta, Campo, Carregando, Etiqueta, TituloPagina, Vazio } from '@/components/ui';

const vazio = { id: null, capitulo: '', titulo: '', descricao: '', categoria: 'documento' };

export default function AdminAulas() {
  const [lista, setLista] = useState(null);
  const [form, setForm] = useState(null);
  const [ficheiro, setFicheiro] = useState(null);
  const [busca, setBusca] = useState('');
  const [msg, setMsg] = useState({ tipo: 'erro', texto: '' });
  const [modalErro, setModalErro] = useState('');
  const [a, setA] = useState(false);

  const carregar = useCallback(() => api('/admin/aulas').then(setLista).catch((e) => setMsg({ tipo: 'erro', texto: e.message })), []);
  useEffect(() => { carregar(); }, [carregar]);

  const filtrada = useMemo(() => (lista || []).filter((l) => `${l.titulo} ${l.capitulo}`.toLowerCase().includes(busca.toLowerCase())), [lista, busca]);
  const abrir = (aula) => { setForm(aula ? { ...aula, descricao: aula.descricao || '' } : { ...vazio }); setFicheiro(null); setModalErro(''); };
  const mudar = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function guardar(e) {
    e.preventDefault();
    setA(true); setModalErro('');
    try {
      const fd = new FormData();
      ['capitulo', 'titulo', 'descricao', 'categoria'].forEach((k) => fd.append(k, form[k] || ''));
      if (ficheiro) fd.append('ficheiro', ficheiro);
      await api(form.id ? `/admin/aulas/${form.id}` : '/admin/aulas', { metodo: form.id ? 'PUT' : 'POST', formData: fd });
      setForm(null); setMsg({ tipo: 'ok', texto: 'Aula guardada com sucesso.' }); carregar();
    } catch (err) { setModalErro(err.message); }
    setA(false);
  }

  async function eliminar(aula) {
    if (!window.confirm(`Eliminar a aula "${aula.titulo}", os seus exercícios e resultados?`)) return;
    try { await api(`/admin/aulas/${aula.id}`, { metodo: 'DELETE' }); setMsg({ tipo: 'ok', texto: 'Aula eliminada.' }); carregar(); }
    catch (err) { setMsg({ tipo: 'erro', texto: err.message }); }
  }

  return (
    <>
      <TituloPagina titulo="Aulas" sub="Publique e organize os conteúdos.">
        <button className="botao" onClick={() => abrir(null)}><Icone nome="mais" size={18} />Nova aula</button>
      </TituloPagina>
      <Alerta tipo={msg.tipo}>{msg.texto}</Alerta>
      <div className="ferramentas"><div className="pesquisa"><Icone nome="pesquisa" size={18} /><input type="search" placeholder="Pesquisar aulas…" value={busca} onChange={(e) => setBusca(e.target.value)} aria-label="Pesquisar aulas" /></div></div>

      {!lista && <Carregando />}
      {lista && filtrada.length === 0 && <Vazio titulo="Sem aulas" texto="Crie a primeira aula para começar." />}
      {filtrada.length > 0 && (
        <div className="tabela-wrap">
          <table className="tabela">
            <thead><tr><th>Módulo</th><th>Título</th><th>Tipo</th><th>Ficheiro</th><th>Exercícios</th><th /></tr></thead>
            <tbody>
              {filtrada.map((l) => (
                <tr key={l.id}>
                  <td data-label="Módulo">{l.capitulo}</td>
                  <td data-label="Título"><b>{l.titulo}</b></td>
                  <td data-label="Tipo"><Etiqueta tipo={l.categoria === 'video' ? '' : 'aviso'}>{l.categoria === 'video' ? 'Vídeo' : 'PDF'}</Etiqueta></td>
                  <td data-label="Ficheiro">{l.tem_ficheiro ? <button className="botao botao-sec botao-peq" onClick={() => abrirFicheiro(l.id).catch((err) => setMsg({ tipo: 'erro', texto: err.message }))}>Ver</button> : <span className="suave">—</span>}</td>
                  <td data-label="Exercícios">{l.total_exercicios}</td>
                  <td className="acoes-td"><div className="acoes">
                    <button className="botao botao-sec botao-peq" onClick={() => abrir(l)}><Icone nome="editar" size={16} />Editar</button>
                    <button className="botao botao-perigo botao-peq" onClick={() => eliminar(l)}><Icone nome="lixo" size={16} />Eliminar</button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {form && (
        <Modal titulo={form.id ? 'Editar aula' : 'Nova aula'} onFechar={() => !a && setForm(null)}>
          <form onSubmit={guardar}>
            <Alerta>{modalErro}</Alerta>
            <div className="form-grelha">
              <Campo rotulo="Módulo / capítulo" id="capitulo"><input id="capitulo" value={form.capitulo} onChange={mudar('capitulo')} required /></Campo>
              <Campo rotulo="Título" id="titulo"><input id="titulo" value={form.titulo} onChange={mudar('titulo')} required /></Campo>
              <Campo rotulo="Categoria" id="categoria">
                <select id="categoria" value={form.categoria} onChange={mudar('categoria')}>
                  <option value="documento">Documento (PDF)</option>
                  <option value="video">Vídeo</option>
                </select>
              </Campo>
              <Campo rotulo={form.id ? 'Substituir ficheiro (opcional)' : 'Ficheiro (PDF ou vídeo)'} id="ficheiro">
                <input id="ficheiro" type="file" accept={form.categoria === 'video' ? 'video/*' : 'application/pdf'} onChange={(e) => setFicheiro(e.target.files[0] || null)} />
              </Campo>
            </div>
            <Campo rotulo="Descrição" id="descricao"><textarea id="descricao" value={form.descricao} onChange={mudar('descricao')} /></Campo>
            {form.id && form.nome_original && <p className="suave">Ficheiro atual: {form.nome_original}</p>}
            <div className="modal-rodape">
              <button type="button" className="botao botao-sec" onClick={() => setForm(null)} disabled={a}>Cancelar</button>
              <button className="botao" disabled={a}>{a ? 'A guardar… (vídeos grandes demoram)' : 'Guardar'}</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
