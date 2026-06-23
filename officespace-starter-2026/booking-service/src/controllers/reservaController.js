const reservaService = require('../services/reservaService');
const { validateReservaInput } = require('../validators/reservaValidator');

async function create(req, res, next) {
  try {
    const { spaceId, fechaInicio, fechaFin, asistentes } = req.body;

    const errors = validateReservaInput({ spaceId, fechaInicio, fechaFin, asistentes });
    if (errors.length) {
      return res.status(400).json({ errors });
    }

    const reserva = await reservaService.create({
      spaceId,
      fechaInicio,
      fechaFin,
      asistentes,
      user: req.user,                       // del middleware JWT
      authHeader: req.headers.authorization, // se reenvía a catalog-service
    });
    res.status(201).json(reserva);
  } catch (err) {
    next(err);
  }
}

async function misReservas(req, res, next) {
  try {
    const reservas = await reservaService.listByUser(req.user.sub, req.headers.authorization);
    res.json(reservas);
  } catch (err) {
    next(err);
  }
}

async function porEspacio(req, res, next) {
  try {
    const reservas = await reservaService.listBySpace(req.params.spaceId, req.headers.authorization);
    res.json(reservas);
  } catch (err) {
    next(err);
  }
}

async function cancel(req, res, next) {
  try {
    const reserva = await reservaService.cancel(req.params.id, req.user.sub, req.headers.authorization);
    res.json(reserva);
  } catch (err) {
    next(err);
  }
}

// Todas las reservas (solo ADMINISTRADOR). Recalcula estados antes de devolver.
async function todas(req, res, next) {
  try {
    await reservaService.syncAll(req.headers.authorization);
    res.json(await reservaService.listAll());
  } catch (err) {
    next(err);
  }
}

// Importación masiva de reservas (solo ADMINISTRADOR).
async function importar(req, res, next) {
  try {
    const rows = Array.isArray(req.body) ? req.body : req.body.reservas;
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'Envía un arreglo de reservas en "reservas"' });
    }
    if (rows.length > 5000) {
      return res.status(400).json({ error: 'Máximo 5000 filas por importación' });
    }
    const resultado = await reservaService.importar(rows, req.headers.authorization);
    res.status(201).json(resultado);
  } catch (err) {
    next(err);
  }
}

// Espacios ocupados en un rango horario (para el buscador de disponibilidad).
async function ocupados(req, res, next) {
  try {
    const { inicio, fin } = req.query;
    if (!inicio || !fin) {
      return res.status(400).json({ error: 'inicio y fin son obligatorios' });
    }
    res.json(await reservaService.ocupadosEnRango(inicio, fin));
  } catch (err) {
    next(err);
  }
}

// Recalcula estados (programada/progreso/finalizada) y sincroniza espacios.
// Pensado para tareas programadas futuras (cron) o disparo manual.
async function sync(req, res, next) {
  try {
    const espacios = await reservaService.syncAll(req.headers.authorization);
    res.json({ ok: true, espaciosSincronizados: espacios });
  } catch (err) {
    next(err);
  }
}

module.exports = { create, misReservas, porEspacio, cancel, sync, ocupados, todas, importar };
