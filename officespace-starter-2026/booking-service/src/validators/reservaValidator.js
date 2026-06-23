// Validaciones críticas de las reservas.
// Devuelve un array de mensajes de error (vacío = válido).

function validateReservaInput({ spaceId, fechaInicio, fechaFin, asistentes }) {
  const errors = [];

  if (!spaceId) errors.push('spaceId es obligatorio');
  if (!fechaInicio) errors.push('fechaInicio es obligatoria');
  if (!fechaFin) errors.push('fechaFin es obligatoria');
  if (asistentes === undefined || asistentes === null || asistentes === '') {
    errors.push('asistentes es obligatorio');
  } else if (!Number.isInteger(Number(asistentes)) || Number(asistentes) < 1) {
    errors.push('asistentes debe ser un número entero mayor o igual a 1');
  }
  if (errors.length) return errors;

  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);

  if (isNaN(inicio.getTime())) errors.push('fechaInicio no es una fecha válida');
  if (isNaN(fin.getTime())) errors.push('fechaFin no es una fecha válida');
  if (errors.length) return errors;

  if (inicio >= fin) errors.push('fechaInicio debe ser anterior a fechaFin');
  if (inicio < new Date()) errors.push('No se puede reservar en el pasado');

  const maxHoras = 8;
  const diffHoras = (fin - inicio) / (1000 * 60 * 60);
  if (diffHoras > maxHoras) {
    errors.push(`La reserva no puede exceder ${maxHoras} horas`);
  }

  return errors;
}

module.exports = { validateReservaInput };
