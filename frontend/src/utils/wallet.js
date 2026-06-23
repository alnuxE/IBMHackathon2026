// Usuario "activo" de la billetera. Como el escenario NO tiene login (usuarios
// pre-registrados), guardamos en localStorage qué usuario está usando la app.

const KEY = 'neowallet_user_id';

export function getCurrentUserId() {
  if (typeof window === 'undefined') return null;
  const v = window.localStorage.getItem(KEY);
  return v ? Number(v) : null;
}

export function setCurrentUserId(id) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(KEY, String(id));
  // Avisar a otros componentes (p.ej. el Nav) que cambió el usuario activo
  window.dispatchEvent(new Event('neowallet:user-changed'));
}

export function clearCurrentUser() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(KEY);
  window.dispatchEvent(new Event('neowallet:user-changed'));
}
