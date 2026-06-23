// Clientes HTTP hacia los microservicios de NeoWallet.
// Cada servicio tiene su propia URL base (son independientes).
// Todas las peticiones autenticadas envían el JWT en el header Authorization.

import { getToken, clearSession } from '../utils/wallet';

// Resuelve la URL base de cada microservicio.
//   - Si hay una variable de entorno EXPLÍCITA (no localhost), se respeta.
//   - Si no, se deriva del host con el que el navegador abrió la app. Así, al
//     entrar desde otro dispositivo por la IP de la LAN (http://172.18.30.218:3002),
//     el navegador llama a http://172.18.30.218:3000/3001 automáticamente, sin
//     reconstruir la imagen por cada IP. (Estándar para apps SPA multi-host.)
function resolveBase(envUrl, port) {
  if (envUrl && !/localhost|127\.0\.0\.1/.test(envUrl)) return envUrl;
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:${port}`;
  }
  return envUrl || `http://localhost:${port}`;
}

const ACCOUNTS_URL = resolveBase(process.env.NEXT_PUBLIC_ACCOUNTS_URL, 3000);
const PROCESSOR_URL = resolveBase(process.env.NEXT_PUBLIC_PROCESSOR_URL, 3001);

// Mensajes legibles para los códigos de error del backend
const ERROR_MESSAGES = {
  user_not_found: 'El usuario no existe.',
  invalid_id: 'Identificador de usuario inválido.',
  invalid_amount: 'El monto debe ser un número positivo con hasta 2 decimales.',
  insufficient_funds: 'Fondos insuficientes para completar la operación.',
  self_transfer_not_allowed: 'No puedes transferirte dinero a ti mismo.',
  invalid_operation: 'Operación inválida.',
  invalid_credentials: 'Email o contraseña incorrectos.',
  unauthorized: 'Tu sesión expiró. Inicia sesión de nuevo.',
  invalid_token: 'Tu sesión expiró. Inicia sesión de nuevo.',
  forbidden: 'No tienes permiso para esta operación.',
  rolled_back: 'La transferencia se revirtió: no se completó, pero tu dinero está a salvo.',
  service_unavailable: 'Un servicio no está disponible. Inténtalo de nuevo.',
};

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = ERROR_MESSAGES[data.error] || data.error || `Error ${res.status}`;
    const err = new Error(msg);
    err.code = data.error;
    err.status = res.status;
    err.payload = data;
    throw err;
  }
  return data;
}

// auth=true añade el token y, ante un 401, cierra la sesión y vuelve al login.
async function request(url, opts = {}, servicio, { auth = true } = {}) {
  const headers = { ...(opts.headers || {}), ...(auth ? authHeaders() : {}) };
  let res;
  try {
    res = await fetch(url, { ...opts, headers });
  } catch (e) {
    throw new Error(`No se pudo conectar con el servicio de ${servicio}. Inténtalo en unos segundos.`);
  }

  if (auth && res.status === 401 && typeof window !== 'undefined') {
    clearSession();
    if (window.location.pathname !== '/') window.location.href = '/';
  }

  return parse(res);
}

const jsonPost = (body) => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

// ---- autenticación (accounts-service) ----
export const authApi = {
  login: (body) => request(`${ACCOUNTS_URL}/auth/login`, jsonPost(body), 'cuentas', { auth: false }),
  me: () => request(`${ACCOUNTS_URL}/auth/me`, {}, 'cuentas'),
};

// ---- accounts-service ----
export const accountsApi = {
  list: () => request(`${ACCOUNTS_URL}/accounts`, {}, 'cuentas'),
  get: (userId) => request(`${ACCOUNTS_URL}/accounts/${userId}`, {}, 'cuentas'),
  recharge: (body) => request(`${ACCOUNTS_URL}/api/recharge`, jsonPost(body), 'cuentas'),
};

// ---- processor-service ----
export const processorApi = {
  transfer: (body) => request(`${PROCESSOR_URL}/api/transfer`, jsonPost(body), 'procesamiento'),
  history: (userId) => request(`${PROCESSOR_URL}/api/transactions/${userId}`, {}, 'procesamiento'),
};
