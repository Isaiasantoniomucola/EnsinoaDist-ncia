const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const CHAVE = 'sessao';

// Alunos: a sessão fica guardada no navegador. Administração: só dura enquanto o separador
// estiver aberto (sessionStorage) — ao fechar, tem de entrar de novo.
export function lerSessao() {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(sessionStorage.getItem(CHAVE) || localStorage.getItem(CHAVE) || 'null'); } catch { return null; }
}
export function limparSessao() {
  try { sessionStorage.removeItem(CHAVE); localStorage.removeItem(CHAVE); } catch { /* ignorar */ }
}
export function guardarSessao(s) {
  limparSessao();
  (s.utilizador.tipo === 'aluno' ? localStorage : sessionStorage).setItem(CHAVE, JSON.stringify(s));
}

// corpo: objeto JSON | formData: FormData (envio de ficheiros)
export async function api(caminho, { metodo = 'GET', corpo, formData, semRedirecionar = false } = {}) {
  const sessao = lerSessao();
  const headers = {};
  if (sessao?.token) headers.Authorization = `Bearer ${sessao.token}`;
  let body;
  if (formData) body = formData;
  else if (corpo) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(corpo); }

  let r;
  try {
    r = await fetch(`${BASE}/api${caminho}`, { method: metodo, headers, body });
  } catch {
    throw new Error('Não foi possível contactar o servidor. Verifique a ligação.');
  }
  const dados = await r.json().catch(() => ({}));
  if (!r.ok) {
    if (r.status === 401 && sessao && !semRedirecionar) {
      limparSessao();
      window.location.assign(sessao.utilizador.tipo === 'aluno' ? '/entrar' : '/admin/entrar');
    }
    const e = new Error(dados.erro || 'Ocorreu um erro. Tente novamente.');
    e.status = r.status;
    throw e;
  }
  return dados;
}

// O ficheiro de uma aula abre-se com um "bilhete" curto (2 h) válido só para essa aula.
// A sessão nunca aparece no endereço (histórico, registos, partilhas).
export async function urlFicheiro(id, descarregar = false) {
  const { bilhete } = await api(`/aulas/${id}/bilhete`, { metodo: 'POST' });
  return `${BASE}/api/aulas/${id}/ficheiro?b=${encodeURIComponent(bilhete)}${descarregar ? '&download=1' : ''}`;
}

// Abre numa nova janela (ou descarrega). A janela abre-se já no clique para o navegador não a bloquear.
export async function abrirFicheiro(id, descarregar = false) {
  const janela = descarregar ? null : window.open('', '_blank');
  try {
    const url = await urlFicheiro(id, descarregar);
    if (janela) { janela.opener = null; janela.location.href = url; } else window.location.assign(url);
  } catch (e) {
    if (janela) janela.close();
    throw e;
  }
}

export const formatarData = (d) => (d ? new Date(d).toLocaleDateString('pt-PT') : '—');
export const percentagem = (p, t) => (t ? Math.round((p / t) * 100) : 0);
