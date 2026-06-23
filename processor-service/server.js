require('dotenv').config();

process.on('unhandledRejection', (reason) => console.error('[processor-service] unhandledRejection:', reason));
process.on('uncaughtException', (err) => console.error('[processor-service] uncaughtException:', err.message));

const app = require('./src/app');
const { waitForDb } = require('./src/config/db');

const PORT = process.env.PORT || 3001;

(async () => {
  await waitForDb(); // espera a que Postgres esté listo antes de aceptar tráfico
  app.listen(PORT, () => {
    console.log(`[processor-service] escuchando en el puerto ${PORT}`);
  });
})();
