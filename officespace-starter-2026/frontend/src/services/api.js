// Clientes HTTP hacia los microservicios.
// Cada servicio tiene su propia URL base (independientes).

const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:4000';
const CATALOG_URL = process.env.NEXT_PUBLIC_CATALOG_URL || 'http://localhost:4001';
const BOOKING_URL = process.env.NEXT_PUBLIC_BOOKING_URL || 'http://localhost:4002';

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}
function jsonHeaders(token) {
  return { 'Content-Type': 'application/json', ...authHeaders(token) };
}

async function parse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.error || (data.errors && data.errors.join(', ')) || `Error ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

// Envoltura resiliente: si el microservicio está caído/inalcanzable, da un mensaje
// claro en vez de romper la app (cada servicio puede fallar de forma aislada).
async function request(url, opts, servicio) {
  let res;
  try {
    res = await fetch(url, opts);
  } catch (e) {
    throw new Error(`No se pudo conectar con el servicio de ${servicio}. Inténtalo de nuevo en unos segundos.`);
  }
  return parse(res);
}

// ---- Auth ----
export const authApi = {
  login: (body) =>
    request(`${AUTH_URL}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }, 'autenticación'),
};

// ---- Usuarios (solo ADMINISTRADOR) ----
export const usersApi = {
  list: (token) => request(`${AUTH_URL}/users`, { headers: authHeaders(token) }, 'usuarios'),
  create: (body, token) => request(`${AUTH_URL}/users`, { method: 'POST', headers: jsonHeaders(token), body: JSON.stringify(body) }, 'usuarios'),
  update: (id, body, token) => request(`${AUTH_URL}/users/${id}`, { method: 'PUT', headers: jsonHeaders(token), body: JSON.stringify(body) }, 'usuarios'),
  remove: (id, token) => request(`${AUTH_URL}/users/${id}`, { method: 'DELETE', headers: authHeaders(token) }, 'usuarios'),
};

// ---- Catálogo: espacios y recursos ----
export const catalogApi = {
  listSpaces: (token) => request(`${CATALOG_URL}/spaces`, { headers: authHeaders(token) }, 'catálogo'),
  getSpace: (id, token) => request(`${CATALOG_URL}/spaces/${id}`, { headers: authHeaders(token) }, 'catálogo'),
  createSpace: (body, token) => request(`${CATALOG_URL}/spaces`, { method: 'POST', headers: jsonHeaders(token), body: JSON.stringify(body) }, 'catálogo'),
  updateSpace: (id, body, token) => request(`${CATALOG_URL}/spaces/${id}`, { method: 'PUT', headers: jsonHeaders(token), body: JSON.stringify(body) }, 'catálogo'),
  removeSpace: (id, token) => request(`${CATALOG_URL}/spaces/${id}`, { method: 'DELETE', headers: authHeaders(token) }, 'catálogo'),

  listRecursos: (token) => request(`${CATALOG_URL}/recursos`, { headers: authHeaders(token) }, 'catálogo'),
  createRecurso: (body, token) => request(`${CATALOG_URL}/recursos`, { method: 'POST', headers: jsonHeaders(token), body: JSON.stringify(body) }, 'catálogo'),
  updateRecurso: (id, body, token) => request(`${CATALOG_URL}/recursos/${id}`, { method: 'PUT', headers: jsonHeaders(token), body: JSON.stringify(body) }, 'catálogo'),
  removeRecurso: (id, token) => request(`${CATALOG_URL}/recursos/${id}`, { method: 'DELETE', headers: authHeaders(token) }, 'catálogo'),
};

// ---- Reservas ----
export const reservaApi = {
  create: (body, token) => request(`${BOOKING_URL}/reservas`, { method: 'POST', headers: jsonHeaders(token), body: JSON.stringify(body) }, 'reservas'),
  mine: (token) => request(`${BOOKING_URL}/reservas/me`, { headers: authHeaders(token) }, 'reservas'),
  all: (token) => request(`${BOOKING_URL}/reservas`, { headers: authHeaders(token) }, 'reservas'),
  importar: (reservas, token) => request(`${BOOKING_URL}/reservas/import`, { method: 'POST', headers: jsonHeaders(token), body: JSON.stringify({ reservas }) }, 'reservas'),
  bySpace: (spaceId, token) => request(`${BOOKING_URL}/reservas/space/${spaceId}`, { headers: authHeaders(token) }, 'reservas'),
  ocupados: (inicio, fin, token) =>
    request(`${BOOKING_URL}/reservas/ocupados?inicio=${encodeURIComponent(inicio)}&fin=${encodeURIComponent(fin)}`, { headers: authHeaders(token) }, 'reservas'),
  sync: (token) => request(`${BOOKING_URL}/reservas/sync`, { method: 'POST', headers: authHeaders(token) }, 'reservas'),
  cancel: (id, token) => request(`${BOOKING_URL}/reservas/${id}/cancel`, { method: 'PATCH', headers: authHeaders(token) }, 'reservas'),
};
