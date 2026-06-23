require('dotenv').config();

process.on('unhandledRejection', (reason) => console.error('[processor-service] unhandledRejection:', reason));
process.on('uncaughtException', (err) => console.error('[processor-service] uncaughtException:', err.message));

const http = require('http');
const app = require('./src/app');
const { waitForDb } = require('./src/config/db');
const { runMigrations } = require('./src/config/migrate');
const { initRealtime } = require('./src/realtime');

const PORT = process.env.PORT || 3001;

(async () => {
  await waitForDb();     // espera a que Postgres esté listo antes de aceptar tráfico
  await runMigrations(); // idempotency_key + índice único

  // Servidor HTTP compartido por la API REST y el gateway WebSocket (Socket.IO).
  const server = http.createServer(app);
  initRealtime(server);

  server.listen(PORT, () => {
    console.log(`[processor-service] escuchando (HTTP + WebSocket) en el puerto ${PORT}`);
  });
})();
