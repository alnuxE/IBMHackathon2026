// Cliente HTTP hacia accounts-service (comunicación entre microservicios).
// La URL se inyecta por variable de entorno (ACCOUNTS_SERVICE_URL).
const axios = require('axios');

const BASE_URL = process.env.ACCOUNTS_SERVICE_URL || 'http://localhost:3000';

const http = axios.create({
  baseURL: BASE_URL,
  timeout: 5000,
});

// Consultar un usuario/saldo (RF-001)
async function getAccount(userId) {
  const { data } = await http.get(`/accounts/${userId}`);
  return data;
}

// Actualizar balance: operation ∈ { 'debit', 'credit' } (RF-004)
async function updateBalance(userId, amount, operation) {
  const { data } = await http.post('/accounts/update-balance', {
    user_id: userId,
    amount,
    operation,
  });
  return data;
}

module.exports = { getAccount, updateBalance };
