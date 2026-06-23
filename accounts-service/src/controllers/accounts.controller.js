// Controladores del accounts-service: validación de entrada + códigos HTTP.
const service = require('../services/accounts.service');

// Valida que un valor sea un entero positivo (ids)
function parseId(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

// Valida un monto: numérico, > 0, máximo 2 decimales (RN-001, RN-005)
function parseAmount(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  if (Math.round(n * 100) !== n * 100) return null; // más de 2 decimales
  return Math.round(n * 100) / 100;
}

// RF-001 · GET /accounts/:userId
async function getAccount(req, res, next) {
  try {
    const id = parseId(req.params.userId);
    if (id === null) return res.status(400).json({ error: 'invalid_id' });

    // Un usuario solo puede consultar su propia cuenta.
    // Las llamadas internas (processor-service) pueden consultar cualquiera.
    if (!req.internal && req.userId !== id) {
      return res.status(403).json({ error: 'forbidden' });
    }

    const user = await service.getById(id);
    if (!user) return res.status(404).json({ error: 'user_not_found' });

    res.json(user);
  } catch (err) {
    next(err);
  }
}

// GET /accounts  · lista de usuarios (para el frontend)
async function listAccounts(req, res, next) {
  try {
    res.json(await service.getAll());
  } catch (err) {
    next(err);
  }
}

// RF-002 · POST /api/recharge   body: { amount, payment_method, idempotency_key? }
// El usuario solo puede recargar SU PROPIA cuenta: el id se toma del token,
// nunca del body. La recarga es un crédito IDEMPOTENTE y queda registrada en el
// ledger (auditoría): un reintento con la misma idempotency_key no recarga dos veces.
async function recharge(req, res, next) {
  try {
    const id = req.userId;

    const amount = parseAmount(req.body.amount);
    if (amount === null) return res.status(400).json({ error: 'invalid_amount' });

    const key = req.body.idempotency_key;
    const opKey = typeof key === 'string' && key.length > 0 ? `recharge:${key}`.slice(0, 80) : null;

    const result = await service.updateBalance(id, amount, 'credit', opKey);
    if (result.notFound) return res.status(404).json({ error: 'user_not_found' });

    res.json({ user_id: id, new_balance: result.new_balance });
  } catch (err) {
    next(err);
  }
}

// RF-004 · POST /accounts/update-balance   body: { user_id, amount, operation }
// operation ∈ { 'debit', 'credit' } — endpoint interno usado por processor-service
async function updateBalance(req, res, next) {
  try {
    const id = parseId(req.body.user_id);
    if (id === null) return res.status(400).json({ error: 'invalid_id' });

    const amount = parseAmount(req.body.amount);
    if (amount === null) return res.status(400).json({ error: 'invalid_amount' });

    const operation = req.body.operation;
    if (operation !== 'debit' && operation !== 'credit') {
      return res.status(400).json({ error: 'invalid_operation' });
    }

    // Clave de idempotencia de la operación (la envía el processor por leg).
    const opKey = typeof req.body.op_key === 'string' && req.body.op_key.length > 0
      ? req.body.op_key.slice(0, 80)
      : null;

    const result = await service.updateBalance(id, amount, operation, opKey);
    if (result.notFound) return res.status(404).json({ error: 'user_not_found' });
    if (result.insufficientFunds) return res.status(400).json({ error: 'insufficient_funds' });

    res.json({
      user_id: id,
      previous_balance: result.previous_balance,
      new_balance: result.new_balance,
    });
  } catch (err) {
    next(err);
  }
}

// GET /accounts/:userId/ledger  (INTERNO) · movimientos de saldo del usuario
async function getLedger(req, res, next) {
  try {
    const id = parseId(req.params.userId);
    if (id === null) return res.status(400).json({ error: 'invalid_id' });
    res.json(await service.getLedger(id));
  } catch (err) {
    next(err);
  }
}

module.exports = { getAccount, listAccounts, recharge, updateBalance, getLedger };
