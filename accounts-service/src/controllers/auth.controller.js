// Controlador de autenticación: login y "quién soy" (me).
const authService = require('../services/auth.service');
const accountsService = require('../services/accounts.service');
const { signToken } = require('../config/auth');

function isEmail(value) {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

// POST /auth/login   body: { email, password }  → { token, user }
async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};
    if (!isEmail(email) || typeof password !== 'string' || password.length === 0) {
      return res.status(400).json({ error: 'invalid_credentials' });
    }

    const user = await authService.verifyCredentials(email, password);
    if (!user) return res.status(401).json({ error: 'invalid_credentials' });

    const token = signToken(user);
    res.json({ token, user });
  } catch (err) {
    next(err);
  }
}

// GET /auth/me   (requiere token)  → datos actualizados del usuario logueado
async function me(req, res, next) {
  try {
    const user = await accountsService.getById(req.userId);
    if (!user) return res.status(404).json({ error: 'user_not_found' });
    res.json(user);
  } catch (err) {
    next(err);
  }
}

module.exports = { login, me };
