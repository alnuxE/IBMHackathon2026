// Formato de dinero (USD, 2 decimales) y fechas.

export function money(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '$0.00';
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

export function dateTime(value) {
  if (!value) return '';
  try {
    return new Date(value).toLocaleString('es-MX', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return String(value);
  }
}

// Iniciales para el avatar (p.ej. "Usuario A (Rico)" -> "UA")
export function initials(name = '') {
  const words = name.replace(/\(.*?\)/g, '').trim().split(/\s+/).filter(Boolean);
  return (words[0]?.[0] || '?').toUpperCase() + (words[1]?.[0] || '').toUpperCase();
}
