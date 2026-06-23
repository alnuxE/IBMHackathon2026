// Conexión a Postgres (processor_db) mediante un pool de conexiones.
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'processor_db',
  user: process.env.DB_USER || 'neowallet',
  password: process.env.DB_PASSWORD || 'neowallet',
  max: 10,
});

async function waitForDb(retries = 10, delayMs = 2000) {
  for (let i = 1; i <= retries; i++) {
    try {
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      console.log('[processor-service] conectado a Postgres (processor_db)');
      return;
    } catch (err) {
      console.log(`[processor-service] Postgres no disponible (intento ${i}/${retries}): ${err.code || err.message}`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw new Error('No se pudo conectar a Postgres');
}

// const { rows } = await query('SELECT * FROM transactions WHERE id = $1', [id]);
function query(text, params) {
  return pool.query(text, params);
}

module.exports = { pool, query, waitForDb };
