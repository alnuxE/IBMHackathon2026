// Migración/seed de autenticación.
// Se ejecuta al arrancar el servicio para que el login funcione tanto en bases
// nuevas como en bases ya existentes (el init.sql solo corre la PRIMERA vez):
//   1. Garantiza la columna `password_hash` en `users`.
//   2. Asigna una contraseña por defecto (hash bcrypt) a los usuarios que aún
//      no tengan una (los 3 usuarios semilla).

const bcrypt = require('bcryptjs');
const { query } = require('./db');

const DEFAULT_PASSWORD = process.env.SEED_PASSWORD || 'neowallet123';

async function runMigrations() {
  await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)');

  // Ledger de idempotencia/auditoría (también para bases ya existentes).
  await query(`
    CREATE TABLE IF NOT EXISTS applied_operations (
      op_key           VARCHAR(80)   PRIMARY KEY,
      user_id          INT           NOT NULL,
      operation        VARCHAR(20)   NOT NULL,
      amount           DECIMAL(10,2) NOT NULL,
      previous_balance DECIMAL(10,2) NOT NULL,
      new_balance      DECIMAL(10,2) NOT NULL,
      created_at       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const { rows } = await query('SELECT id FROM users WHERE password_hash IS NULL');
  if (rows.length > 0) {
    const hash = bcrypt.hashSync(DEFAULT_PASSWORD, 10);
    await query('UPDATE users SET password_hash = $1 WHERE password_hash IS NULL', [hash]);
    console.log(`[accounts-service] contraseña por defecto asignada a ${rows.length} usuario(s)`);
  }
}

module.exports = { runMigrations, DEFAULT_PASSWORD };
