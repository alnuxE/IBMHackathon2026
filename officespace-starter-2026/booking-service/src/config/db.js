const mongoose = require('mongoose');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Conexión a MongoDB con reintentos (resiliencia ante BD lenta o caída temporal).
async function connectDB(retries = 10, delayMs = 2000) {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/officespace';
  for (let intento = 1; intento <= retries; intento++) {
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
      console.log('[booking-service] conectado a MongoDB');
      mongoose.connection.on('error', (e) => console.error('[booking-service] error de MongoDB:', e.message));
      mongoose.connection.on('disconnected', () => console.warn('[booking-service] MongoDB desconectado, reintentando…'));
      return;
    } catch (err) {
      console.error(`[booking-service] MongoDB intento ${intento}/${retries} falló: ${err.message}`);
      if (intento === retries) {
        console.error('[booking-service] sin conexión a MongoDB tras varios intentos, saliendo');
        process.exit(1);
      }
      await sleep(delayMs);
    }
  }
}

module.exports = connectDB;
