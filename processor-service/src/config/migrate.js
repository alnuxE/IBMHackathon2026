// Migración del processor-service. Se ejecuta al arrancar para que la
// idempotencia funcione también en bases ya existentes (el init.sql solo corre
// la primera vez): añade la columna idempotency_key y su índice único.

const { query } = require('./db');

async function runMigrations() {
  await query('ALTER TABLE transactions ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(64)');
  await query(`
    CREATE UNIQUE INDEX IF NOT EXISTS uq_transactions_idempotency
      ON transactions (idempotency_key)
  `);
  console.log('[processor-service] migraciones aplicadas (idempotency_key)');
}

module.exports = { runMigrations };
