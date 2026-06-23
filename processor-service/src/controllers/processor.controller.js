// Controladores del processor-service.
// 👉 Todo lo marcado con TODO es lo que tienes que implementar.

const service = require('../services/processor.service');

// RF-003 · POST /api/transfer   body: { sender_id, receiver_id, amount }
async function transfer(req, res, next) {
  try {
    // TODO (RF-003) — validaciones de entrada:
    //  - sender_id != receiver_id        → 400 { error: 'self_transfer_not_allowed' }
    //  - amount > 0 y numérico            → 400 { error: 'invalid_amount' }
    //  Luego delega al service, que orquesta la transferencia (patrón Saga):
    //  const result = await service.transfer(sender_id, receiver_id, amount);
    //  Mapear result a HTTP:
    //   - ok                       → 201 { transaction_id, status: 'COMPLETED' }
    //   - 'user_not_found'         → 404
    //   - 'insufficient_funds'     → 400
    //   - 'rolled_back' / 'failed' → 409 / 500 según el caso
    res.status(501).json({ error: 'not_implemented', endpoint: 'transfer (RF-003)' });
  } catch (err) {
    next(err);
  }
}

// RF-005 (BONUS) · GET /api/transactions/:userId
async function getTransactions(req, res, next) {
  try {
    // TODO (RF-005):
    //  1. Validar userId numérico
    //  2. const list = await service.getHistory(userId)
    //  3. 200 con la lista ordenada por fecha desc, con el tipo (sent/received)
    res.status(501).json({ error: 'not_implemented', endpoint: 'getTransactions (RF-005)' });
  } catch (err) {
    next(err);
  }
}

module.exports = { transfer, getTransactions };
