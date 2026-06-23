const spaceService = require('../services/spaceService');

async function list(req, res, next) {
  try {
    const spaces = await spaceService.list({
      tipo: req.query.tipo,
      status: req.query.status,
    });
    res.json(spaces);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const space = await spaceService.getById(req.params.id);
    res.json(space);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const space = await spaceService.create(req.body);
    res.status(201).json(space);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const space = await spaceService.update(req.params.id, req.body);
    res.json(space);
  } catch (err) {
    next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    const space = await spaceService.updateStatus(req.params.id, req.body.status);
    res.json(space);
  } catch (err) {
    next(err);
  }
}

async function setReservas(req, res, next) {
  try {
    const space = await spaceService.setReservas(req.params.id, req.body.reservasProgramadas || []);
    res.json(space);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await spaceService.remove(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getById, create, update, updateStatus, setReservas, remove };
