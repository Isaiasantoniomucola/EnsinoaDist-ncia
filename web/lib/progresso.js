// Progresso das vídeo-aulas (posição onde parou e aulas concluídas), guardado neste navegador.
import { lerSessao } from './api';

const chave = () => `ead:progresso:${lerSessao()?.utilizador?.id || 'anon'}`;

export function lerProgresso() {
  try { return JSON.parse(localStorage.getItem(chave()) || '{}'); } catch { return {}; }
}

export function atualizarProgresso(aulaId, parcial) {
  const p = lerProgresso();
  p[aulaId] = { ...(p[aulaId] || {}), ...parcial, em: Date.now() };
  try { localStorage.setItem(chave(), JSON.stringify(p)); } catch { /* armazenamento cheio/bloqueado */ }
  return p;
}

export function formatarTempo(s) {
  if (!Number.isFinite(s) || s < 0) return '0:00';
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), seg = Math.floor(s % 60);
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(seg).padStart(2, '0')}` : `${m}:${String(seg).padStart(2, '0')}`;
}

// Ordem natural dos módulos ("Módulo 2" antes de "Módulo 10").
export const ordenarAulas = (lista) =>
  [...lista].sort((a, b) => a.capitulo.localeCompare(b.capitulo, 'pt', { numeric: true }) || a.id - b.id);
