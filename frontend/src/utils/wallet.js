// Sesión del usuario autenticado. Tras el login guardamos el JWT y los datos
// del usuario en localStorage; el token se envía en cada petición al backend.

const TOKEN_KEY = 'neowallet_token';
const USER_KEY = 'neowallet_user';

export function getToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function getCurrentUser() {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(USER_KEY);
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getCurrentUserId() {
  return getCurrentUser()?.id ?? null;
}

export function isAuthenticated() {
  return Boolean(getToken());
}

export function setSession(token, user) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  // Avisar a otros componentes (p.ej. el Nav) que cambió la sesión
  window.dispatchEvent(new Event('neowallet:user-changed'));
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event('neowallet:user-changed'));
}
