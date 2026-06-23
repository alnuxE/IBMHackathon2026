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

// Directorio de usuarios (id, nombre, email) — SIN saldos.
// Lo usa el frontend para elegir destinatario en una transferencia; el saldo de
// otros usuarios no se expone (cada quien solo ve el suyo vía getById).
async function getAll() {
  const { rows } = await query(
    'SELECT id, name, email FROM users ORDER BY id ASC'
  );
  return rows.map((row) => ({ id: row.id, name: row.name, email: row.email }));
}

// RF-004 / RF-002 · Débito/crédito ATÓMICO e IDEMPOTENTE.
//
// `opKey` (opcional pero recomendado) es una clave única de la operación. Si la
// misma opKey llega dos veces (reintento por timeout/red), la segunda vez NO se
// vuelve a aplicar: se devuelve el resultado guardado. Esto resuelve la
// ambigüedad de los timeouts (la operación pudo haberse confirmado aunque la
// respuesta se perdiera) y evita crear/destruir dinero (RNF-006).
//
// Devuelve { notFound } | { insufficientFunds }
//        | { previous_balance, new_balance, idempotent_replay? }
async function updateBalance(userId, amount, operation, opKey = null) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Idempotencia: ¿ya se aplicó esta operación? → devolver el resultado previo.
    if (opKey) {
      const dup = await client.query(
        'SELECT previous_balance, new_balance FROM applied_operations WHERE op_key = $1',
        [opKey]
      );
      if (dup.rows[0]) {
        await client.query('COMMIT'); // no hay nada que aplicar
        return {
          previous_balance: Number(dup.rows[0].previous_balance),
          new_balance: Number(dup.rows[0].new_balance),
          idempotent_replay: true,
        };
      }
    }

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
    const newBalance = Number(upd.rows[0].balance);

    // Registrar en el ledger (idempotencia + auditoría) en la MISMA transacción.
    if (opKey) {
      await client.query(
        `INSERT INTO applied_operations
           (op_key, user_id, operation, amount, previous_balance, new_balance)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [opKey, userId, operation, amount, previous, newBalance]
      );
    }

    await client.query('COMMIT');
    return { previous_balance: previous, new_balance: newBalance };
  } catch (err) {
    await client.query('ROLLBACK');

    // Carrera: dos peticiones con la misma opKey a la vez. Una gana el INSERT
    // (violación de PK 23505 en la otra) → la perdedora devuelve el resultado ya aplicado.
    if (err.code === '23505' && opKey) {
      const dup = await pool.query(
        'SELECT previous_balance, new_balance FROM applied_operations WHERE op_key = $1',
        [opKey]
      );
      if (dup.rows[0]) {
        return {
          previous_balance: Number(dup.rows[0].previous_balance),
          new_balance: Number(dup.rows[0].new_balance),
          idempotent_replay: true,
        };
      }
    }
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { getById, getAll, updateBalance };
