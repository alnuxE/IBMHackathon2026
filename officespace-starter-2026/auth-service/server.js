require('dotenv').config();

// Resiliencia: registrar fallos inesperados en vez de morir en silencio
process.on('unhandledRejection', (reason) => console.error('[auth-service] unhandledRejection:', reason));
process.on('uncaughtException', (err) => console.error('[auth-service] uncaughtException:', err.message));

const app = require('./src/app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 4000;

(async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`[auth-service] escuchando en el puerto ${PORT}`);
  });
})();
