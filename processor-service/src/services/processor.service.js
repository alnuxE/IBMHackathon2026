// Lógica de negocio del processor-service: orquesta la transferencia P2P.
//
// IMPORTANTE (RNF-006): el processor NO toca la tabla `users` directamente.
// Modifica saldos llamando al accounts-service vía HTTP (accountsClient).
// El estado de cada transferencia se persiste en la tabla `transactions`.
//
// 👉 Implementa la transferencia siguiendo el patrón Saga (sección 6 / RF-003 / CU-005).

const { query, pool } = require('../config/db');
const accountsClient = require('../clients/accounts.client');
const TxModel = require('../models/transaction.model');

// RF-003 · Transferencia P2P con compensación (Saga)
async function transfer(senderId, receiverId, amount) {
  // TODO — flujo recomendado (ver RF-003, pasos 6-10, y CU-005):
  //
  //  1. Crear transacción en estado PENDING:
  //     const { rows } = await query(
  //       `INSERT INTO transactions (sender_id, receiver_id, amount, status)
  //        VALUES ($1, $2, $3, 'PENDING') RETURNING id`, [senderId, receiverId, amount]);
  //     const txId = rows[0].id;
  //
  //  2. DEBITAR al sender (accounts-service):
  //     await accountsClient.updateBalance(senderId, amount, 'debit');
  //     - si responde insufficient_funds  → marcar tx FAILED y devolver { error: 'insufficient_funds' }
  //     - si el sender no existe           → marcar tx FAILED y devolver { error: 'user_not_found' }
  //     - si ok                           → marcar tx DEBITED
  //
  //  3. ACREDITAR al receiver (accounts-service):
  //     try {
  //       await accountsClient.updateBalance(receiverId, amount, 'credit');
  //     } catch (e) {
  //       // COMPENSACIÓN: devolver el dinero al sender y marcar ROLLED_BACK
  //       await accountsClient.updateBalance(senderId, amount, 'credit');
  //       await setStatus(txId, 'ROLLED_BACK', e.message);
  //       return { error: 'rolled_back' };
  //     }
  //
  //  4. Marcar tx COMPLETED y devolver { transaction_id: txId }
  //
  //  CRÍTICO: bajo ninguna circunstancia se debe perder dinero (RNF-006).
  throw new Error('not_implemented: processor.service.transfer');
}

// Helper sugerido para cambiar el estado de una transacción
async function setStatus(txId, status, errorMessage = null) {
  await query(
    'UPDATE transactions SET status = $1, error_message = $2 WHERE id = $3',
    [status, errorMessage, txId]
  );
}

// RF-005 (BONUS) · Historial de un usuario
async function getHistory(userId) {
  // TODO:
  // const { rows } = await query(
  //   `SELECT * FROM transactions
  //    WHERE sender_id = $1 OR receiver_id = $1
  //    ORDER BY created_at DESC`, [userId]);
  // return rows.map(t => ({ ...t, type: t.sender_id === Number(userId) ? 'sent' : 'received' }));
  throw new Error('not_implemented: processor.service.getHistory');
}

module.exports = { transfer, getHistory, setStatus };
