const Space = require('../models/Space');

const STATUS_VALUES = ['alta', 'baja', 'ninguna'];

// Jornada de referencia para medir disponibilidad: 07:00–22:00 (15 h)
const JORNADA_INICIO = 7;
const JORNADA_FIN = 22;

// Día de referencia: hoy si aún estamos dentro de la jornada, si no, mañana.
function diaReferencia() {
  const d = new Date();
  if (d.getHours() >= JORNADA_FIN) d.setDate(d.getDate() + 1);
  return d;
}

// Deriva el nivel de disponibilidad del espacio según las horas reservadas en la
// próxima jornada laboral (09:00–18:00):
//   alta    -> jornada libre
//   baja    -> hay reservas pero queda hueco
//   ninguna -> la jornada está completa
function nivelDisponibilidad(reservas = [], ref = diaReferencia()) {
  const inicio = new Date(ref); inicio.setHours(JORNADA_INICIO, 0, 0, 0);
  const fin = new Date(ref); fin.setHours(JORNADA_FIN, 0, 0, 0);
  const jornadaMs = fin - inicio;

  let ocupadoMs = 0;
  for (const r of reservas) {
    const s = new Date(r.fechaInicio);
    const e = new Date(r.fechaFin);
    const solape = Math.min(e.getTime(), fin.getTime()) - Math.max(s.getTime(), inicio.getTime());
    if (solape > 0) ocupadoMs += solape;
  }

  if (ocupadoMs <= 0) return 'alta';
  if (ocupadoMs >= jornadaMs) return 'ninguna';
  return 'baja';
}

async function list(filter = {}) {
  const query = {};
  if (filter.tipo) query.tipo = filter.tipo;
  if (filter.status) query.status = filter.status;
  return Space.find(query).sort({ codigo: 1 });
}

async function getById(id) {
  const space = await Space.findById(id);
  if (!space) {
    const err = new Error('Espacio no encontrado');
    err.status = 404;
    throw err;
  }
  return space;
}

async function create(data) {
  return Space.create(data);
}

async function update(id, data) {
  const space = await Space.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!space) {
    const err = new Error('Espacio no encontrado');
    err.status = 404;
    throw err;
  }
  return space;
}

// Reemplaza el array de reservas embebidas del espacio y DERIVA su nivel de
// disponibilidad (alta/baja/ninguna) según las horas reservadas hoy.
// Lo invoca booking-service vía HTTP al crear/cancelar/sincronizar reservas.
async function setReservas(id, reservasProgramadas = []) {
  const status = nivelDisponibilidad(reservasProgramadas);

  const space = await Space.findByIdAndUpdate(
    id,
    { reservasProgramadas, status },
    { new: true }
  );
  if (!space) {
    const err = new Error('Espacio no encontrado');
    err.status = 404;
    throw err;
  }
  return space;
}

// Cambia solo el status. Lo usa booking-service durante el ciclo de la reserva.
async function updateStatus(id, status) {
  if (!STATUS_VALUES.includes(status)) {
    const err = new Error(`status inválido (usa: ${STATUS_VALUES.join(', ')})`);
    err.status = 400;
    throw err;
  }
  const space = await Space.findByIdAndUpdate(id, { status }, { new: true });
  if (!space) {
    const err = new Error('Espacio no encontrado');
    err.status = 404;
    throw err;
  }
  return space;
}

async function remove(id) {
  const space = await Space.findByIdAndDelete(id);
  if (!space) {
    const err = new Error('Espacio no encontrado');
    err.status = 404;
    throw err;
  }
  return space;
}

module.exports = { list, getById, create, update, updateStatus, setReservas, remove };
