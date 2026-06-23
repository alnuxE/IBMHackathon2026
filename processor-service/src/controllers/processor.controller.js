// Controladores del processor-service: validación + mapeo a códigos HTTP.
const service = require('../services/processor.service');

function parseId(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function parseAmount(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  if (Math.round(n * 100) !== n * 100) return null; // más de 2 decimales
  return Math.round(n * 100) / 100;
}

// Mapea el error de negocio del service a un código HTTP
function statusForError(error) {
  switch (error) {
    case 'self_transfer_not_allowed':
    case 'invalid_amount':
    case 'invalid_id':
    case 'insufficient_funds':
      return 400;
    case 'user_not_found':
      return 404;
    case 'rolled_back':
    case 'in_progress': // un reintento llegó mientras la original aún se procesa
    case 'failed':
      return 409; // no se completó, pero el dinero no se perdió/duplicó
    default:
      return 502; // service_unavailable / rollback_failed
  }
}

// RF-003 · POST /api/transfer   body: { receiver_id, amount }
// El sender es SIEMPRE el usuario autenticado (req.userId), no el body:
// nadie puede transferir dinero desde una cuenta que no es la suya.
async function transfer(req, res, next) {
  try {
    const senderId = req.userId;
    const receiverId = parseId(req.body.receiver_id);
    if (receiverId === null) {
      return res.status(400).json({ error: 'invalid_id' });
    }
    if (senderId === receiverId) {
      return res.status(400).json({ error: 'self_transfer_not_allowed' });
    }
    const amount = parseAmount(req.body.amount);
    if (amount === null) {
      return res.status(400).json({ error: 'invalid_amount' });
    }

    // Clave de idempotencia de la intención del cliente (anti reintento duplicado).
    const rawKey = req.body.idempotency_key;
    const idempotencyKey = typeof rawKey === 'string' && rawKey.length > 0
      ? rawKey.slice(0, 64)
      : null;

    const result = await service.transfer(senderId, receiverId, amount, idempotencyKey);

    if (result.error) {
      return res.status(statusForError(result.error)).json(result);
    }
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

// RF-005 (BONUS) · GET /api/transactions/:userId
async function getTransactions(req, res, next) {
  try {
    const id = parseId(req.params.userId);
    if (id === null) return res.status(400).json({ error: 'invalid_id' });

    // Solo se puede consultar el propio historial.
    if (id !== req.userId) return res.status(403).json({ error: 'forbidden' });

    res.json(await service.getHistory(id));
  } catch (err) {
    next(err);
  }
}

module.exports = { transfer, getTransactions };
