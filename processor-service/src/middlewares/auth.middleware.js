// Middleware de autenticación del processor-service.
// Exige un JWT de usuario válido (el mismo que emite el accounts-service) y
// expone req.userId, que se usa como sender_id de la transferencia.

const { verifyToken } = require('../config/auth');

function requireUser(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'unauthorized' });

  try {
    const payload = verifyToken(token);
    req.userId = Number(payload.sub);
    next();
  } catch {
    return res.status(401).json({ error: 'invalid_token' });
  }
}

module.exports = { requireUser };
