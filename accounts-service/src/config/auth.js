// Configuración y helpers de autenticación (JWT) del accounts-service.
// El secreto se inyecta por variable de entorno (JWT_SECRET) y es COMPARTIDO
// con el processor-service para que ambos puedan verificar el mismo token.

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '12h';

// Clave para comunicación servicio-a-servicio (processor → accounts).
// Protege los endpoints internos (update-balance) que NO debe llamar un usuario.
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || 'dev-internal-key';

// Arranque seguro: en producción es INACEPTABLE usar secretos por defecto o
// vacíos (cualquiera podría forjar tokens o llamar al endpoint interno). En ese
// caso el servicio se NIEGA a arrancar. En desarrollo solo avisa.
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

// Firma un JWT con los datos públicos del usuario (nunca incluir el hash).
function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// Verifica y decodifica un JWT. Lanza si es inválido o expiró.
function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = { JWT_SECRET, JWT_EXPIRES_IN, INTERNAL_API_KEY, signToken, verifyToken };
