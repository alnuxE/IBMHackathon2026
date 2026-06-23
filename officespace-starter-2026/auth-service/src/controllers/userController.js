const userService = require('../services/userService');
const { ROLE_VALUES } = require('../constants/roles');

async function list(req, res, next) {
  try {
    res.json(await userService.list());
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { usuario, password, rol } = req.body;
    if (!usuario || !password || !rol) {
      return res.status(400).json({ error: 'usuario, password y rol son obligatorios' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }
    if (!ROLE_VALUES.includes(rol)) {
      return res.status(400).json({ error: `rol inválido (usa: ${ROLE_VALUES.join(', ')})` });
    }
    const user = await userService.create({ usuario, password, rol });
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const { rol } = req.body;
    if (rol && !ROLE_VALUES.includes(rol)) {
      return res.status(400).json({ error: `rol inválido (usa: ${ROLE_VALUES.join(', ')})` });
    }
    const user = await userService.update(req.params.id, req.body);
    res.json(user);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    // Evita que un admin se borre a sí mismo
    if (req.params.id === req.user.sub) {
      return res.status(400).json({ error: 'No puedes eliminar tu propio usuario' });
    }
    await userService.remove(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create, update, remove };
