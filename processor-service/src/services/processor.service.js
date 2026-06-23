// Lógica del processor-service: orquesta la transferencia P2P (patrón Saga)
// de forma RESILIENTE a fallos de red.
//
// Claves del diseño (mitigan los riesgos de pérdida/creación/duplicación de dinero):
//   1. Idempotencia de la INTENCIÓN: la transferencia se identifica con una
//      idempotency_key. Un reintento del mismo POST no crea una transacción nueva.
//   2. Idempotencia de cada MOVIMIENTO de saldo: cada leg (debit/credit/compensate)
//      lleva una op_key estable derivada del id de la transacción. El accounts-service
//      no aplica dos veces la misma op_key.
//   3. Reintentos con backoff ante errores de red / 5xx. Como los movimientos son
//      idempotentes, reintentar es SEGURO: un timeout que en realidad SÍ se aplicó
//      se confirma en el reintento (no se compensa por error).
//
// El processor NO toca la tabla `users`: mueve saldos vía HTTP al accounts-service.

const { query } = require('../config/db');
const accountsClient = require('../clients/accounts.client');
const { STATUS } = require('../models/transaction.model');
const realtime = require('../realtime');

const MAX_ATTEMPTS = 3;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Extrae status/código del error remoto del accounts-service (si lo hay)
function remoteError(err) {
  return { status: err.response?.status, code: err.response?.data?.error };
}

// ¿El error es transitorio (vale la pena reintentar)? Sí en timeouts/caídas de
// red (sin respuesta) y en 5xx. NO en 4xx (404, insufficient_funds, etc.): son
// respuestas definitivas del servidor.
function isRetriable(err) {
  const status = err.response?.status;
  if (status === undefined) return true;          // timeout / ECONNREFUSED / red caída
  return status >= 500 && status <= 599;
}

// Ejecuta fn reintentando con backoff lineal mientras el error sea transitorio.
async function withRetry(fn) {
  let lastErr;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (!isRetriable(err) || attempt === MAX_ATTEMPTS) throw err;
      await sleep(attempt * 250); // 250ms, 500ms
    }
  }
  throw lastErr;
}

async function setStatus(txId, status, errorMessage = null) {
  await query(
    'UPDATE transactions SET status = $1, error_message = $2 WHERE id = $3',
    [status, errorMessage, txId]
  );
}

// Mapea el estado de una transacción ya existente (replay idempotente) a la
// respuesta que verá el cliente, SIN re-ejecutar nada.
function resultFromExisting(txId, status) {
  if (status === STATUS.COMPLETED) return { transaction_id: txId, status, idempotent_replay: true };
  if (status === STATUS.ROLLED_BACK) return { error: 'rolled_back', transaction_id: txId };
  if (status === STATUS.FAILED) return { error: 'failed', transaction_id: txId };
  // PENDING / DEBITED → todavía en curso (otra petición la está procesando).
  return { error: 'in_progress', transaction_id: txId };
}

// RF-003 · Transferencia P2P idempotente y resiliente (Saga con compensación).
async function transfer(senderId, receiverId, amount, idempotencyKey = null) {
  // 1. Crear la transacción (o recuperarla si la idempotency_key ya existe).
  const insert = await query(
    `INSERT INTO transactions (sender_id, receiver_id, amount, status, idempotency_key)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (idempotency_key) DO NOTHING
     RETURNING id`,
    [senderId, receiverId, amount, STATUS.PENDING, idempotencyKey]
  );

  let txId;
  if (insert.rows[0]) {
    txId = insert.rows[0].id;
  } else {
    // Reintento del MISMO intento: devolver el estado actual, no duplicar.
    const existing = await query(
      'SELECT id, status FROM transactions WHERE idempotency_key = $1',
      [idempotencyKey]
    );
    const row = existing.rows[0];
    return resultFromExisting(row.id, row.status);
  }

  // op_keys estables por leg → idempotencia de cada movimiento de saldo.
  const debitKey = `tx${txId}:debit`;
  const creditKey = `tx${txId}:credit`;
  const compensateKey = `tx${txId}:compensate`;

  // 2. Verificar que el receiver exista ANTES de mover dinero.
  try {
    await withRetry(() => accountsClient.getAccount(receiverId));
  } catch (err) {
    const { status } = remoteError(err);
    if (status === 404) {
      await setStatus(txId, STATUS.FAILED, 'receiver_not_found');
      return { error: 'user_not_found', transaction_id: txId };
    }
    await setStatus(txId, STATUS.FAILED, `accounts_unreachable: ${err.message}`);
    return { error: 'service_unavailable', transaction_id: txId };
  }

  // 3. DEBITAR al sender (idempotente + reintentos).
  try {
    await withRetry(() => accountsClient.updateBalance(senderId, amount, 'debit', debitKey));
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
    // Aquí el débito es AMBIGUO (la red falló tras agotar reintentos). El ledger
    // de idempotencia permite reconciliarlo después sin riesgo de doble cobro.
    await setStatus(txId, STATUS.FAILED, `debit_unconfirmed: ${err.message}`);
    return { error: 'service_unavailable', transaction_id: txId };
  }
  await setStatus(txId, STATUS.DEBITED);

  // 4. ACREDITAR al receiver (idempotente + reintentos).
  try {
    await withRetry(() => accountsClient.updateBalance(receiverId, amount, 'credit', creditKey));
  } catch (err) {
    // COMPENSACIÓN (Saga): devolver el dinero al sender. También idempotente y
    // con reintentos → no se devuelve dos veces ni se rinde a la primera.
    try {
      await withRetry(() => accountsClient.updateBalance(senderId, amount, 'credit', compensateKey));
      await setStatus(txId, STATUS.ROLLED_BACK, `credit_failed: ${err.message}`);
      return { error: 'rolled_back', transaction_id: txId };
    } catch (compErr) {
      // La compensación tampoco se confirmó. Queda registrado para reconciliación;
      // gracias a las op_keys el estado real es recuperable sin duplicar dinero.
      await setStatus(txId, STATUS.FAILED, `rollback_unconfirmed: ${compErr.message}`);
      return { error: 'rollback_failed', transaction_id: txId };
    }
  }

  // 5. Completar.
  await setStatus(txId, STATUS.COMPLETED);

  // Notificación en tiempo real (best-effort): el receptor ve entrar el dinero en
  // vivo y el emisor recibe confirmación. No afecta la consistencia del dinero.
  realtime.emitToUser(receiverId, 'transfer:incoming', { transaction_id: txId, from: senderId, amount });
  realtime.emitToUser(senderId, 'transfer:completed', { transaction_id: txId, to: receiverId, amount });

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
