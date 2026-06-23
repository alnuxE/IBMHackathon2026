// Lógica del processor-service: orquesta la transferencia P2P (patrón Saga).
//
// El processor NO toca la tabla `users`: modifica saldos llamando al
// accounts-service vía HTTP. El estado de cada transferencia se persiste en
// la tabla `transactions`. CRÍTICO: no se pierde dinero bajo ninguna
// circunstancia (RNF-006 / CU-005).

const { query } = require('../config/db');
const accountsClient = require('../clients/accounts.client');
const { STATUS } = require('../models/transaction.model');

// Extrae el código de error que devolvió el accounts-service (si lo hay)
function remoteError(err) {
  return {
    status: err.response?.status,
    code: err.response?.data?.error,
  };
}

async function setStatus(txId, status, errorMessage = null) {
  await query(
    'UPDATE transactions SET status = $1, error_message = $2 WHERE id = $3',
    [status, errorMessage, txId]
  );
}

// RF-003 · Transferencia P2P con compensación (Saga).
// Devuelve { transaction_id, status } en éxito, o { error, transaction_id } en fallo.
async function transfer(senderId, receiverId, amount) {
  // 1. Registrar la transacción en estado PENDING
  const { rows } = await query(
    `INSERT INTO transactions (sender_id, receiver_id, amount, status)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [senderId, receiverId, amount, STATUS.PENDING]
  );
  const txId = rows[0].id;

  // 2. Verificar que el receiver exista ANTES de mover dinero (evita débito inútil)
  try {
    await accountsClient.getAccount(receiverId);
  } catch (err) {
    const { status } = remoteError(err);
    if (status === 404) {
      await setStatus(txId, STATUS.FAILED, 'receiver_not_found');
      return { error: 'user_not_found', transaction_id: txId };
    }
    await setStatus(txId, STATUS.FAILED, `accounts_unreachable: ${err.message}`);
    return { error: 'service_unavailable', transaction_id: txId };
  }

  // 3. DEBITAR al sender
  try {
    await accountsClient.updateBalance(senderId, amount, 'debit');
  } catch (err) {
    const { status, code } = remoteError(err);
    if (status === 400 && code === 'insufficient_funds') {
      await setStatus(txId, STATUS.FAILED, 'insufficient_funds');
      return { error: 'insufficient_funds', transaction_id: txId };
    }
    if (status === 404) {
      await setStatus(txId, STATUS.FAILED, 'sender_not_found');
      return { error: 'user_not_found', transaction_id: txId };
    }
    await setStatus(txId, STATUS.FAILED, `debit_failed: ${err.message}`);
    return { error: 'service_unavailable', transaction_id: txId };
  }
  await setStatus(txId, STATUS.DEBITED);

  // 4. ACREDITAR al receiver
  try {
    await accountsClient.updateBalance(receiverId, amount, 'credit');
  } catch (err) {
    // COMPENSACIÓN (Saga): devolver el dinero al sender
    try {
      await accountsClient.updateBalance(senderId, amount, 'credit');
      await setStatus(txId, STATUS.ROLLED_BACK, `credit_failed: ${err.message}`);
      return { error: 'rolled_back', transaction_id: txId };
    } catch (compErr) {
      // Caso extremo: la compensación también falló. Se deja registrado para
      // reconciliación manual; el dinero NO se duplica (solo está debitado).
      await setStatus(txId, STATUS.FAILED, `rollback_failed: ${compErr.message}`);
      return { error: 'rollback_failed', transaction_id: txId };
    }
  }

  // 5. Completar
  await setStatus(txId, STATUS.COMPLETED);
  return { transaction_id: txId, status: STATUS.COMPLETED };
}

// RF-005 (BONUS) · Historial de un usuario (enviadas + recibidas)
async function getHistory(userId) {
  const { rows } = await query(
    `SELECT id, sender_id, receiver_id, amount, status, created_at
     FROM transactions
     WHERE sender_id = $1 OR receiver_id = $1
     ORDER BY created_at DESC, id DESC`,
    [userId]
  );
  return rows.map((t) => ({
    id: t.id,
    sender_id: t.sender_id,
    receiver_id: t.receiver_id,
    amount: Number(t.amount),
    status: t.status,
    created_at: t.created_at,
    // Punto de vista del usuario consultado
    type: t.sender_id === Number(userId) ? 'sent' : 'received',
    counterparty_id: t.sender_id === Number(userId) ? t.receiver_id : t.sender_id,
  }));
}

module.exports = { transfer, getHistory, setStatus };
