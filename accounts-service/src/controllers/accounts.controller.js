// Controladores del accounts-service.
// Aquí va la validación de entrada y la traducción a códigos HTTP.
// La lógica de negocio/datos vive en ../services/accounts.service.js
//
// 👉 Todo lo marcado con TODO es lo que tienes que implementar.

const service = require('../services/accounts.service');

// RF-001 · GET /accounts/:userId
async function getAccount(req, res, next) {
  try {
    // TODO (RF-001):
    //  1. Validar que req.params.userId sea numérico  → si no, 400 { error: 'invalid_id' }
    //  2. const user = await service.getById(id)
    //  3. Si no existe → 404 { error: 'user_not_found' }
    //  4. Si existe → 200 { id, name, email, balance }
    res.status(501).json({ error: 'not_implemented', endpoint: 'getAccount (RF-001)' });
  } catch (err) {
    next(err);
  }
}

// RF-002 · POST /api/recharge   body: { user_id, amount, payment_method }
async function recharge(req, res, next) {
  try {
    // TODO (RF-002):
    //  1. Validar user_id y amount (amount > 0, numérico, 2 decimales) → 400 si falla
    //  2. Verificar que el usuario exista → 404 si no
    //  3. const result = await service.recharge(user_id, amount)
    //  4. 200 { user_id, new_balance }
    res.status(501).json({ error: 'not_implemented', endpoint: 'recharge (RF-002)' });
  } catch (err) {
    next(err);
  }
}

// RF-004 · POST /accounts/update-balance   body: { user_id, amount, operation }
// operation ∈ { 'debit', 'credit' }  — endpoint interno usado por processor-service
async function updateBalance(req, res, next) {
  try {
    // TODO (RF-004):
    //  1. Validar user_id, amount y operation ('debit' | 'credit')
    //  2. Si operation === 'debit': verificar fondos suficientes (balance >= amount)
    //     - si no alcanza → 400 { error: 'insufficient_funds' }
    //  3. Aplicar la operación de forma ATÓMICA (ver service.updateBalance)
    //  4. 200 { user_id, previous_balance, new_balance }
    res.status(501).json({ error: 'not_implemented', endpoint: 'updateBalance (RF-004)' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAccount, recharge, updateBalance };
