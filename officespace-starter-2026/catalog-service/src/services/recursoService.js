const Recurso = require('../models/Recurso');

async function list(filter = {}) {
  const query = {};
  if (filter.onlyActive) query.activo = true;
  if (filter.categoria) query.categoria = filter.categoria;
  return Recurso.find(query).sort({ nombre: 1 });
}

async function getById(id) {
  const recurso = await Recurso.findById(id);
  if (!recurso) {
    const err = new Error('Recurso no encontrado');
    err.status = 404;
    throw err;
  }
  return recurso;
}

async function create(data) {
  return Recurso.create(data);
}

async function update(id, data) {
  const recurso = await Recurso.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!recurso) {
    const err = new Error('Recurso no encontrado');
    err.status = 404;
    throw err;
  }
  return recurso;
}

async function remove(id) {
  const recurso = await Recurso.findByIdAndDelete(id);
  if (!recurso) {
    const err = new Error('Recurso no encontrado');
    err.status = 404;
    throw err;
  }
  return recurso;
}

module.exports = { list, getById, create, update, remove };
