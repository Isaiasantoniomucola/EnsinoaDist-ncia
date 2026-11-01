import * as SecureStore from 'expo-secure-store';
import { API_URL } from './config';

let sessao = null;
let aoExpirar = null;

export const definirAoExpirar = (fn) => { aoExpirar = fn; };
export const lerSessao = () => sessao;

export async function carregarSessao() {
  try { const s = await SecureStore.getItemAsync('sessao'); sessao = s ? JSON.parse(s) : null; } catch { sessao = null; }
  return sessao;
}
export async function guardarSessao(s) { sessao = s; await SecureStore.setItemAsync('sessao', JSON.stringify(s)); }
export async function limparSessao() { sessao = null; try { await SecureStore.deleteItemAsync('sessao'); } catch {} }

export async function api(caminho, { metodo = 'GET', corpo, semExpirar = false } = {}) {
  const headers = {};
  if (sessao?.token) headers.Authorization = `Bearer ${sessao.token}`;
  if (corpo) headers['Content-Type'] = 'application/json';
  let r;
  try {
    r = await fetch(`${API_URL}/api${caminho}`, { method: metodo, headers, body: corpo ? JSON.stringify(corpo) : undefined });
  } catch {
    throw new Error('Não foi possível contactar o servidor. Verifique a ligação.');
  }
  const dados = await r.json().catch(() => ({}));
  if (!r.ok) {
    if (r.status === 401 && sessao && !semExpirar) { await limparSessao(); aoExpirar && aoExpirar(); }
    throw new Error(dados.erro || 'Ocorreu um erro. Tente novamente.');
  }
  return dados;
}

// O ficheiro abre-se com um bilhete curto (2 h) válido só para essa aula; a sessão nunca vai no endereço.
export async function urlFicheiro(id, descarregar = false) {
  const { bilhete } = await api(`/aulas/${id}/bilhete`, { metodo: 'POST' });
  return `${API_URL}/api/aulas/${id}/ficheiro?b=${encodeURIComponent(bilhete)}${descarregar ? '&download=1' : ''}`;
}

export const percentagem = (p, t) => (t ? Math.round((p / t) * 100) : 0);
