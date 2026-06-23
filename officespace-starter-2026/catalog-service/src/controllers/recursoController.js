const recursoService = require('../services/recursoService');

async function list(req, res, next) {
  try {
    const recursos = await recursoService.list({
      onlyActive: req.query.activo === 'true',
      categoria: req.query.categoria,
    });
    res.json(recursos);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    res.json(await recursoService.getById(req.params.id));
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const recurso = await recursoService.create(req.body);
    res.status(201).json(recurso);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    res.json(await recursoService.update(req.params.id, req.body));
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await recursoService.remove(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getById, create, update, remove };
