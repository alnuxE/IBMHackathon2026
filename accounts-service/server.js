require('dotenv').config();

// Resiliencia: registrar fallos inesperados en vez de morir en silencio
process.on('unhandledRejection', (reason) => console.error('[accounts-service] unhandledRejection:', reason));
process.on('uncaughtException', (err) => console.error('[accounts-service] uncaughtException:', err.message));

const app = require('./src/app');
const { waitForDb } = require('./src/config/db');
const { runMigrations } = require('./src/config/migrate');

const PORT = process.env.PORT || 3000;

(async () => {
  await waitForDb();    // espera a que Postgres esté listo antes de aceptar tráfico
  await runMigrations(); // garantiza columna password_hash + contraseñas semilla
  app.listen(PORT, () => {
    console.log(`[accounts-service] escuchando en el puerto ${PORT}`);
  });
})();
