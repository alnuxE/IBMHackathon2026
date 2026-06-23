// Cliente HTTP hacia accounts-service (comunicación entre microservicios).
// La URL se inyecta por variable de entorno (ACCOUNTS_SERVICE_URL).
const axios = require('axios');
const { INTERNAL_API_KEY } = require('../config/auth');

const BASE_URL = process.env.ACCOUNTS_SERVICE_URL || 'http://localhost:3000';

// La clave interna autentica al processor como un servicio de confianza ante el
// accounts-service (le permite consultar cualquier cuenta y mover saldos).
const http = axios.create({
  baseURL: BASE_URL,
  timeout: 5000,
  headers: { 'X-Internal-Key': INTERNAL_API_KEY },
});

// Consultar un usuario/saldo (RF-001)
async function getAccount(userId) {
  const { data } = await http.get(`/accounts/${userId}`);
  return data;
}

// Actualizar balance: operation ∈ { 'debit', 'credit' } (RF-004).
// opKey identifica la operación para que el accounts-service la aplique de forma
// IDEMPOTENTE: un reintento con la misma opKey no vuelve a mover el saldo.
async function updateBalance(userId, amount, operation, opKey) {
  const { data } = await http.post('/accounts/update-balance', {
    user_id: userId,
    amount,
    operation,
    op_key: opKey,
  });
  return data;
}

// Ledger de movimientos de saldo de un usuario (para el estado de cuenta)
async function getLedger(userId) {
  const { data } = await http.get(`/accounts/${userId}/ledger`);
  return data;
}

module.exports = { getAccount, updateBalance, getLedger };
