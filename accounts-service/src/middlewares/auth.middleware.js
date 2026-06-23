// Middlewares de autenticación del accounts-service.
//
//   requireUser   → exige un JWT de usuario válido (Authorization: Bearer ...).
//   authenticate  → acepta JWT de usuario O clave interna (servicio-a-servicio).
//   requireInternal → solo clave interna (X-Internal-Key); rechaza usuarios.
//
// Tras autenticar un usuario se exponen req.userId y req.user.
// Para llamadas internas se expone req.internal = true.

const { verifyToken, INTERNAL_API_KEY } = require('../config/auth');

function bearerToken(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

function hasValidInternalKey(req) {
  const key = req.headers['x-internal-key'];
  return Boolean(key) && key === INTERNAL_API_KEY;
}

function attachUserFromToken(req, res) {
  const token = bearerToken(req);
  if (!token) {
    res.status(401).json({ error: 'unauthorized' });
    return false;
  }
  try {
    const payload = verifyToken(token);
    req.userId = Number(payload.sub);
    req.user = { id: Number(payload.sub), email: payload.email, name: payload.name };
    return true;
  } catch {
    res.status(401).json({ error: 'invalid_token' });
    return false;
  }
}

// Exige un JWT de usuario válido.
function requireUser(req, res, next) {
  if (attachUserFromToken(req, res)) next();
}

// Acepta usuario autenticado O una llamada interna (processor-service).
function authenticate(req, res, next) {
  if (hasValidInternalKey(req)) {
    req.internal = true;
    return next();
  }
  if (attachUserFromToken(req, res)) next();
}

// Solo permite llamadas internas (servicio-a-servicio).
function requireInternal(req, res, next) {
  if (hasValidInternalKey(req)) return next();
  res.status(401).json({ error: 'unauthorized' });
}

module.exports = { requireUser, authenticate, requireInternal };
