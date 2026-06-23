// Lógica de negocio y acceso a datos del accounts-service.
// Usa consultas parametrizadas ($1, $2, ...) para evitar SQL injection (RNF-004).
//
// 👉 Implementa cada función. Abajo tienes ejemplos/pistas comentadas.

const { query, pool } = require('../config/db');
const UserModel = require('../models/user.model');

// RF-001 · Obtener un usuario por id
async function getById(id) {
  // TODO:
  // const { rows } = await query('SELECT id, name, email, balance FROM users WHERE id = $1', [id]);
  // return rows[0] || null;
  throw new Error('not_implemented: accounts.service.getById');
}

// RF-002 · Sumar fondos al saldo del usuario
async function recharge(userId, amount) {
  // TODO:
  // const { rows } = await query(
  //   'UPDATE users SET balance = balance + $1 WHERE id = $2 RETURNING balance',
  //   [amount, userId]
  // );
  // return rows[0]?.balance ?? null;
  throw new Error('not_implemented: accounts.service.recharge');
}

// RF-004 · Débito/crédito atómico (lo llama processor-service)
async function updateBalance(userId, amount, operation) {
  // TODO (operación ATÓMICA — usar transacción + bloqueo de fila):
  // const client = await pool.connect();
  // try {
  //   await client.query('BEGIN');
  //   const { rows } = await client.query('SELECT balance FROM users WHERE id = $1 FOR UPDATE', [userId]);
  //   if (!rows[0]) { await client.query('ROLLBACK'); return { notFound: true }; }
  //   const previous = Number(rows[0].balance);
  //   if (operation === 'debit' && previous < amount) {
  //     await client.query('ROLLBACK');
  //     return { insufficientFunds: true };
  //   }
  //   const delta = operation === 'debit' ? -amount : amount;
  //   const upd = await client.query(
  //     'UPDATE users SET balance = balance + $1 WHERE id = $2 RETURNING balance',
  //     [delta, userId]
  //   );
  //   await client.query('COMMIT');
  //   return { previous_balance: previous, new_balance: Number(upd.rows[0].balance) };
  // } catch (e) {
  //   await client.query('ROLLBACK');
  //   throw e;
  // } finally {
  //   client.release();
  // }
  throw new Error('not_implemented: accounts.service.updateBalance');
}

module.exports = { getById, recharge, updateBalance };
