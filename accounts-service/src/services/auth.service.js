// Lógica de autenticación: verificar credenciales (email + contraseña).
// Usa consultas parametrizadas y compara el hash con bcrypt (RNF-004).

const bcrypt = require('bcryptjs');
const { query } = require('../config/db');

// Devuelve el usuario (sin el hash) si las credenciales son válidas, o null.
async function verifyCredentials(email, password) {
  const { rows } = await query(
    'SELECT id, name, email, balance, password_hash FROM users WHERE email = $1',
    [email]
  );
  const row = rows[0];
  if (!row || !row.password_hash) return null;

  const ok = await bcrypt.compare(password, row.password_hash);
  if (!ok) return null;

  return { id: row.id, name: row.name, email: row.email, balance: Number(row.balance) };
}

module.exports = { verifyCredentials };
