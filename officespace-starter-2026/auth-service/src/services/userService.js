const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function list() {
  return User.find().sort({ usuario: 1 });
}

async function getById(id) {
  const user = await User.findById(id);
  if (!user) {
    const err = new Error('Usuario no encontrado');
    err.status = 404;
    throw err;
  }
  return user;
}

async function create({ usuario, password, rol }) {
  const existing = await User.findOne({ usuario });
  if (existing) {
    const err = new Error('El usuario ya existe');
    err.status = 409;
    throw err;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  return User.create({ usuario, passwordHash, rol });
}

async function update(id, { usuario, password, rol }) {
  const data = {};
  if (usuario) data.usuario = usuario;
  if (rol) data.rol = rol;
  if (password) data.passwordHash = await bcrypt.hash(password, 10);

  const user = await User.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!user) {
    const err = new Error('Usuario no encontrado');
    err.status = 404;
    throw err;
  }
  return user;
}

async function remove(id) {
  const user = await User.findByIdAndDelete(id);
  if (!user) {
    const err = new Error('Usuario no encontrado');
    err.status = 404;
    throw err;
  }
  return user;
}

module.exports = { list, getById, create, update, remove };
