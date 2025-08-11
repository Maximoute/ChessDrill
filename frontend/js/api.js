// frontend/js/api.js

const BASE = (window.API_BASE_URL || '/api').replace(/\/+$/, ''); // ex: '/api'
const DEFAULT_HEADERS = { 'Content-Type': 'application/json' };
const TIMEOUT_MS = 10000; // 10s

function withTimeout(promise, ms = TIMEOUT_MS) {
  const timeout = new Promise((_, rej) =>
    setTimeout(() => rej(new Error(`Request timeout after ${ms}ms`)), ms)
  );
  return Promise.race([promise, timeout]);
}

async function handleResponse(r) {
  const ct = r.headers.get('content-type') || '';
  const isJson = ct.includes('application/json');

  const text = await r.text(); // on lit toujours le texte (utile pour logs/erreurs)
  if (!r.ok) {
    // renvoie les 200 premiers caractères pour debug (HTML de 502, etc.)
    throw new Error(`HTTP ${r.status} ${r.statusText}: ${text.slice(0, 200)}`);
  }

  if (isJson) {
    try { return JSON.parse(text); }
    catch {
      throw new Error(`Invalid JSON: ${text.slice(0, 200)}`);
    }
  }
  // Pas JSON: renvoyer brut (au cas où certaines routes renvoient du texte)
  return text;
}

async function request(path, { method = 'GET', body, headers = {} } = {}) {
  const url = `${BASE}${path}`;
  const opts = {
    method,
    headers: { ...DEFAULT_HEADERS, ...headers },
  };
  if (body !== undefined) opts.body = JSON.stringify(body);

  try {
    const res = await withTimeout(fetch(url, opts));
    return await handleResponse(res);
  } catch (err) {
    // Log côté client pour debug
    console.error(`[API] ${method} ${url} failed:`, err);
    throw err;
  }
}

/* ----------------- Endpoints ----------------- */

export const health = () => request('/health');

export const list = () => request('/exercises');

export const get = (id) => request(`/exercises/${id}`);

export const create = (payload) =>
  request('/exercises', { method: 'POST', body: payload });

export const update = (id, payload) =>
  request(`/exercises/${id}`, { method: 'PUT', body: payload });

export const remove = (id) =>
  request(`/exercises/${id}`, { method: 'DELETE' });

/* -------------- Helpers optionnels -------------- */

// ping rapide pour vérifier la connexion API depuis le front (utile au démarrage)
export async function ensureApiAlive() {
  try {
    await health();
    return true;
  } catch {
    return false;
  }
}
