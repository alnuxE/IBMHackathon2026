const authService = require('../services/authService');

async function login(req, res, next) {
  try {
    const { usuario, password } = req.body;
    if (!usuario || !password) {
      return res.status(400).json({ error: 'usuario y password son obligatorios' });
    }
    const { user, token } = await authService.login({ usuario, password });
    res.json({ user, token });
  } catch (err) {
    next(err);
  }
}

module.exports = { login };
