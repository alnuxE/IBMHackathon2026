// Autenticación del processor-service.
// Verifica los JWT que emite el accounts-service usando el MISMO secreto
// (JWT_SECRET compartido por variable de entorno). También expone la clave
// interna que se envía al accounts-service en las llamadas servicio-a-servicio.

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || 'dev-internal-key';

// Arranque seguro: hard-fail en producción si los secretos son por defecto/vacíos.
const INSECURE_DEFAULTS = { JWT_SECRET: 'dev-secret-change-me', INTERNAL_API_KEY: 'dev-internal-key' };
function assertSecret(name, value, insecureDefault) {
  const insecure = !value || value === insecureDefault;
  if (!insecure) return;
  const msg = `[seguridad] ${name} no está definido o usa el valor por defecto inseguro.`;
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`${msg} Define un secreto fuerte antes de arrancar en producción.`);
  }
  console.warn(`⚠️  ${msg} NO usar así en producción.`);
}
assertSecret('JWT_SECRET', process.env.JWT_SECRET, INSECURE_DEFAULTS.JWT_SECRET);
assertSecret('INTERNAL_API_KEY', process.env.INTERNAL_API_KEY, INSECURE_DEFAULTS.INTERNAL_API_KEY);

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = { JWT_SECRET, INTERNAL_API_KEY, verifyToken };
