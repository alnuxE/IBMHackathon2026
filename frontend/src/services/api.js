// Clientes HTTP hacia los microservicios de NeoWallet.
// Cada servicio tiene su propia URL base (son independientes).

const ACCOUNTS_URL = process.env.NEXT_PUBLIC_ACCOUNTS_URL || 'http://localhost:3000';
const PROCESSOR_URL = process.env.NEXT_PUBLIC_PROCESSOR_URL || 'http://localhost:3001';

// Mensajes legibles para los códigos de error del backend
const ERROR_MESSAGES = {
  user_not_found: 'El usuario no existe.',
  invalid_id: 'Identificador de usuario inválido.',
  invalid_amount: 'El monto debe ser un número positivo con hasta 2 decimales.',
  insufficient_funds: 'Fondos insuficientes para completar la operación.',
  self_transfer_not_allowed: 'No puedes transferirte dinero a ti mismo.',
  invalid_operation: 'Operación inválida.',
  rolled_back: 'La transferencia se revirtió: no se completó, pero tu dinero está a salvo.',
  service_unavailable: 'Un servicio no está disponible. Inténtalo de nuevo.',
};

async function parse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = ERROR_MESSAGES[data.error] || data.error || `Error ${res.status}`;
    const err = new Error(msg);
    err.code = data.error;
    err.payload = data;
    throw err;
  }
  return data;
}

async function request(url, opts, servicio) {
  let res;
  try {
    res = await fetch(url, opts);
  } catch (e) {
    throw new Error(`No se pudo conectar con el servicio de ${servicio}. Inténtalo en unos segundos.`);
  }
  return parse(res);
}

const jsonPost = (body) => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

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
