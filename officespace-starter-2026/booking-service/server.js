require('dotenv').config();

// Resiliencia: registrar fallos inesperados en vez de morir en silencio
process.on('unhandledRejection', (reason) => console.error('[booking-service] unhandledRejection:', reason));
process.on('uncaughtException', (err) => console.error('[booking-service] uncaughtException:', err.message));

const app = require('./src/app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 4002;

(async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`[booking-service] escuchando en el puerto ${PORT}`);
  });
})();
