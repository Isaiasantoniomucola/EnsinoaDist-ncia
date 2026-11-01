'use client';
import { useCallback, useEffect, useState } from 'react';
import { api, formatarData } from '@/lib/api';
import { useSessao } from '@/components/AuthProvider';
import Icone from '@/components/Icones';
import Modal from '@/components/Modal';
import { Alerta, Avatar, Campo, Carregando, Etiqueta, TituloPagina } from '@/components/ui';

const vazio = { id: null, nome: '', email: '', senha: '', perfil: 'administrador' };

export default function AdminUtilizadores() {
  const { sessao } = useSessao();
  const [lista, setLista] = useState(null);
  const [form, setForm] = useState(null);
  const [msg, setMsg] = useState({ tipo: 'erro', texto: '' });
  const [modalErro, setModalErro] = useState('');

  const carregar = useCallback(() => api('/admin/utilizadores').then(setLista).catch((e) => setMsg({ tipo: 'erro', texto: e.message })), []);
  useEffect(() => { carregar(); }, [carregar]);
  const mudar = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function guardar(e) {
    e.preventDefault();
    setModalErro('');
    try {
      await api(form.id ? `/admin/utilizadores/${form.id}` : '/admin/utilizadores', { metodo: form.id ? 'PUT' : 'POST', corpo: form });
      setForm(null); setMsg({ tipo: 'ok', texto: 'Administrador guardado.' }); carregar();
    } catch (err) { setModalErro(err.message); }
  }

  async function eliminar(u) {
    if (!window.confirm(`Eliminar o administrador ${u.nome}?`)) return;
    try { await api(`/admin/utilizadores/${u.id}`, { metodo: 'DELETE' }); carregar(); }
    catch (err) { setMsg({ tipo: 'erro', texto: err.message }); }
  }

  return (
    <>
      <TituloPagina titulo="Administradores" sub="Contas com acesso à administração.">
        <button className="botao" onClick={() => { setModalErro(''); setForm({ ...vazio }); }}><Icone nome="mais" size={18} />Novo administrador</button>
      </TituloPagina>
      <Alerta tipo={msg.tipo}>{msg.texto}</Alerta>

      {!lista && <Carregando />}
      {lista && (
        <div className="tabela-wrap">
          <table className="tabela">
            <thead><tr><th>Administrador</th><th>Perfil</th><th>Criado em</th><th /></tr></thead>
            <tbody>
              {lista.map((u) => (
                <tr key={u.id}>
                  <td data-label="Administrador"><div className="pessoa"><Avatar nome={u.nome} /><div><b>{u.nome}</b><small>{u.email}</small></div></div></td>
                  <td data-label="Perfil"><Etiqueta tipo="ok">Administrador</Etiqueta></td>
                  <td data-label="Criado em">{formatarData(u.criado_em)}</td>
                  <td className="acoes-td"><div className="acoes">
                    <button className="botao botao-sec botao-peq" onClick={() => { setModalErro(''); setForm({ ...u, senha: '' }); }}><Icone nome="editar" size={16} />Editar</button>
                    {u.id !== sessao.utilizador.id && <button className="botao botao-perigo botao-peq" onClick={() => eliminar(u)}><Icone nome="lixo" size={16} />Eliminar</button>}
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {form && (
        <Modal titulo={form.id ? 'Editar administrador' : 'Novo administrador'} onFechar={() => setForm(null)}>
          <form onSubmit={guardar}>
            <Alerta>{modalErro}</Alerta>
            <div className="form-grelha">
              <Campo rotulo="Nome" id="nome"><input id="nome" value={form.nome} onChange={mudar('nome')} required /></Campo>
              <Campo rotulo="E-mail" id="email"><input id="email" type="email" value={form.email} onChange={mudar('email')} required /></Campo>
              <Campo rotulo={form.id ? 'Nova palavra-passe (opcional)' : 'Palavra-passe'} id="senha" dica="Mín. 10 caracteres, com maiúsculas, minúsculas e números">
                <input id="senha" type="password" autoComplete="new-password" minLength={10} value={form.senha} onChange={mudar('senha')} required={!form.id} />
              </Campo>
            </div>
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
