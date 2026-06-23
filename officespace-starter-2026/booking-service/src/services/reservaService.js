const axios = require('axios');
const Reserva = require('../models/Reserva');

const CATALOG_URL = process.env.CATALOG_SERVICE_URL || 'http://localhost:4001';

// Estados "activos" (los que se embeben en el espacio).
const ACTIVOS = ['programada', 'progreso'];

// --- Comunicación con catalog-service (HTTP, no acceso directo a su BD) ----

async function fetchSpace(spaceId, authHeader) {
  try {
    const { data } = await axios.get(`${CATALOG_URL}/spaces/${spaceId}`, {
      headers: { Authorization: authHeader },
      timeout: 5000,
    });
    return data;
  } catch (err) {
    if (err.response && err.response.status === 404) {
      const e = new Error('El espacio indicado no existe');
      e.status = 404;
      throw e;
    }
    const e = new Error('No se pudo contactar al catálogo de espacios');
    e.status = 502;
    throw e;
  }
}

// Calcula el estado de una reserva según la hora actual.
function calcularEstado(reserva, now) {
  if (now >= reserva.fechaFin) return 'finalizada';
  if (now >= reserva.fechaInicio) return 'progreso';
  return 'programada';
}

// Sincroniza un espacio: recalcula los estados de sus reservas activas,
// marca como finalizadas las que ya terminaron (se quedan en `reservas` pero
// salen del array embebido) y envía a catalog-service el array resultante.
// No es crítico: si la llamada HTTP falla, se registra y se continúa.
async function syncSpace(spaceId, authHeader, now = new Date()) {
  const activas = await Reserva.find({ spaceId, status: { $in: ACTIVOS } });

  const embebidas = [];
  for (const r of activas) {
    const nuevo = calcularEstado(r, now);
    if (nuevo !== r.status) {
      // updateOne en vez de save(): cambia solo el status sin revalidar todo el doc
      await Reserva.updateOne({ _id: r._id }, { status: nuevo });
    }
    if (nuevo !== 'finalizada') {
      embebidas.push({
        reservaId: r._id,
        usuario: r.usuario,
        fechaInicio: r.fechaInicio,
        fechaFin: r.fechaFin,
        status: nuevo,
      });
    }
  }

  try {
    await axios.put(
      `${CATALOG_URL}/spaces/${spaceId}/reservas`,
      { reservasProgramadas: embebidas },
      { headers: { Authorization: authHeader }, timeout: 5000 }
    );
  } catch (err) {
    console.error(`[booking-service] no se pudo sincronizar el espacio ${spaceId}:`, err.message);
  }
}

// Sincroniza todos los espacios con reservas activas.
async function syncAll(authHeader, now = new Date()) {
  const spaceIds = await Reserva.distinct('spaceId', { status: { $in: ACTIVOS } });
  for (const id of spaceIds) {
    await syncSpace(id, authHeader, now);
  }
  return spaceIds.length;
}

// --- Lógica de reservas ----------------------------------------------------

async function hasOverlap(spaceId, inicio, fin) {
  const overlap = await Reserva.findOne({
    spaceId,
    status: { $in: ACTIVOS },
    fechaInicio: { $lt: fin },
    fechaFin: { $gt: inicio },
  });
  return Boolean(overlap);
}

async function create({ spaceId, fechaInicio, fechaFin, asistentes, user, authHeader }) {
  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);
  const personas = Number(asistentes);

  // 1) Verifica el espacio en catalog-service (HTTP, reenviando el JWT)
  const space = await fetchSpace(spaceId, authHeader);

  // 2) Valida capacidad: los asistentes no pueden exceder la capacidad del espacio
  if (personas > space.capacidad) {
    const e = new Error(`El número de asistentes (${personas}) excede la capacidad del espacio (${space.capacidad})`);
    e.status = 400;
    throw e;
  }

  // 3) Verifica disponibilidad
  if (await hasOverlap(spaceId, inicio, fin)) {
    const e = new Error('El espacio ya está reservado en ese horario');
    e.status = 409;
    throw e;
  }

  // 4) Crea la reserva (programada)
  const reserva = await Reserva.create({
    spaceId,
    spaceCodigo: space.codigo,
    spaceNombre: space.nombre,
    fechaInicio: inicio,
    fechaFin: fin,
    asistentes: personas,
    userId: user.sub,
    usuario: user.usuario,
    status: 'programada',
  });

  // 4) Sincroniza el espacio (embebe la reserva y deriva su status)
  await syncSpace(spaceId, authHeader);

  return reserva;
}

// Todas las reservas (vista de administrador, para exportar).
async function listAll() {
  return Reserva.find().sort({ fechaInicio: -1 });
}

// Importación masiva (migración desde el "Excel compartido").
// Resuelve el espacio por código, valida lo esencial (fechas y capacidad) y
// asigna el estado según el tiempo. Permite fechas pasadas (es histórico).
async function importar(rows, authHeader) {
  let spaces = [];
  try {
    const { data } = await axios.get(`${CATALOG_URL}/spaces`, { headers: { Authorization: authHeader }, timeout: 8000 });
    spaces = data;
  } catch (err) {
    const e = new Error('No se pudo obtener el catálogo de espacios');
    e.status = 502;
    throw e;
  }
  const byCodigo = new Map(spaces.map((s) => [String(s.codigo).toUpperCase(), s]));
  const byId = new Map(spaces.map((s) => [String(s._id), s]));
  const now = new Date();

  const aInsertar = [];
  const rechazadas = [];

  rows.forEach((row, i) => {
    const fila = i + 1;
    const space = byId.get(String(row.spaceId)) || byCodigo.get(String(row.spaceCodigo || '').toUpperCase());
    if (!space) { rechazadas.push({ fila, motivo: `Espacio no encontrado (${row.spaceCodigo || row.spaceId || '—'})` }); return; }

    const ini = new Date(row.fechaInicio);
    const fin = new Date(row.fechaFin);
    if (isNaN(ini.getTime()) || isNaN(fin.getTime())) { rechazadas.push({ fila, motivo: 'Fechas inválidas' }); return; }
    if (ini >= fin) { rechazadas.push({ fila, motivo: 'fechaInicio debe ser anterior a fechaFin' }); return; }

    const asis = Number(row.asistentes);
    if (!Number.isInteger(asis) || asis < 1) { rechazadas.push({ fila, motivo: 'asistentes inválido' }); return; }
    if (asis > space.capacidad) { rechazadas.push({ fila, motivo: `asistentes (${asis}) excede la capacidad (${space.capacidad})` }); return; }

    aInsertar.push({
      spaceId: String(space._id), spaceCodigo: space.codigo, spaceNombre: space.nombre,
      fechaInicio: ini, fechaFin: fin, asistentes: asis,
      userId: 'import', usuario: row.usuario || 'import@corporativoalpha.com',
      status: calcularEstado({ fechaInicio: ini, fechaFin: fin }, now),
    });
  });

  let importadas = 0;
  if (aInsertar.length) {
    const res = await Reserva.insertMany(aInsertar, { ordered: false });
    importadas = res.length;
  }
  return { total: rows.length, importadas, rechazadas };
}

// Devuelve los spaceId con una reserva ACTIVA que solapa el rango [inicio, fin).
// Lo usa el buscador de disponibilidad del frontend.
async function ocupadosEnRango(inicio, fin) {
  return Reserva.distinct('spaceId', {
    status: { $in: ACTIVOS },
    fechaInicio: { $lt: new Date(fin) },
    fechaFin: { $gt: new Date(inicio) },
  });
}

async function listByUser(userId, authHeader) {
  await syncAll(authHeader);
  return Reserva.find({ userId }).sort({ fechaInicio: -1 });
}

async function listBySpace(spaceId, authHeader) {
  await syncSpace(spaceId, authHeader);
  return Reserva.find({ spaceId, status: { $in: ACTIVOS } }).sort({ fechaInicio: 1 });
}

async function cancel(id, userId, authHeader) {
  const reserva = await Reserva.findById(id);
  if (!reserva) {
    const e = new Error('Reserva no encontrada');
    e.status = 404;
    throw e;
  }
  if (reserva.userId !== userId) {
    const e = new Error('No puedes cancelar una reserva de otro usuario');
    e.status = 403;
    throw e;
  }
  if (reserva.status !== 'programada') {
    const e = new Error('Solo se pueden cancelar reservas programadas');
    e.status = 400;
    throw e;
  }
  reserva.status = 'cancelada';
  await reserva.save();

  // Re-sincroniza el espacio (la reserva sale del array embebido)
  await syncSpace(reserva.spaceId, authHeader);

  return reserva;
}

module.exports = { create, listByUser, listBySpace, cancel, syncAll, ocupadosEnRango, listAll, importar };
