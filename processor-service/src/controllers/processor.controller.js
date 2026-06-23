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
      return 409; // se revirtió: no se perdió dinero, pero la transferencia no se completó
    default:
      return 502; // service_unavailable / rollback_failed
  }
}

// RF-003 · POST /api/transfer   body: { sender_id, receiver_id, amount }
async function transfer(req, res, next) {
  try {
    const senderId = parseId(req.body.sender_id);
    const receiverId = parseId(req.body.receiver_id);
    if (senderId === null || receiverId === null) {
      return res.status(400).json({ error: 'invalid_id' });
    }
    if (senderId === receiverId) {
      return res.status(400).json({ error: 'self_transfer_not_allowed' });
    }
    const amount = parseAmount(req.body.amount);
    if (amount === null) {
      return res.status(400).json({ error: 'invalid_amount' });
    }

    const result = await service.transfer(senderId, receiverId, amount);

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

    res.json(await service.getHistory(id));
  } catch (err) {
    next(err);
  }
}

module.exports = { transfer, getTransactions };
