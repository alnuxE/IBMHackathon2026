// Lógica de negocio y acceso a datos del accounts-service.
// Usa consultas parametrizadas ($1, $2, ...) para evitar SQL injection (RNF-004).

const { query, pool } = require('../config/db');

function mapUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    balance: Number(row.balance), // pg devuelve DECIMAL como string
  };
}

// RF-001 · Obtener un usuario por id
async function getById(id) {
  const { rows } = await query(
    'SELECT id, name, email, balance FROM users WHERE id = $1',
    [id]
  );
  return mapUser(rows[0]);
}

// Listar todos los usuarios (lo usa el frontend: no hay registro/login)
async function getAll() {
  const { rows } = await query(
    'SELECT id, name, email, balance FROM users ORDER BY id ASC'
  );
  return rows.map(mapUser);
}

// RF-002 · Sumar fondos al saldo del usuario. Devuelve null si no existe.
async function recharge(userId, amount) {
  const { rows } = await query(
    'UPDATE users SET balance = balance + $1 WHERE id = $2 RETURNING balance',
    [amount, userId]
  );
  if (!rows[0]) return null;
  return Number(rows[0].balance);
}

// RF-004 · Débito/crédito ATÓMICO (lo llama processor-service).
// Devuelve { notFound } | { insufficientFunds } | { previous_balance, new_balance }
async function updateBalance(userId, amount, operation) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Bloquea la fila para evitar condiciones de carrera (RNF-006)
    const sel = await client.query('SELECT balance FROM users WHERE id = $1 FOR UPDATE', [userId]);
    if (!sel.rows[0]) {
      await client.query('ROLLBACK');
      return { notFound: true };
    }

    const previous = Number(sel.rows[0].balance);
    if (operation === 'debit' && previous < amount) {
      await client.query('ROLLBACK');
      return { insufficientFunds: true };
    }

    const delta = operation === 'debit' ? -amount : amount;
    const upd = await client.query(
      'UPDATE users SET balance = balance + $1 WHERE id = $2 RETURNING balance',
      [delta, userId]
    );

    await client.query('COMMIT');
    return { previous_balance: previous, new_balance: Number(upd.rows[0].balance) };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { getById, getAll, recharge, updateBalance };
