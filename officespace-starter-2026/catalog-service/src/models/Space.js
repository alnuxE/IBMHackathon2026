const mongoose = require('mongoose');

// Recurso asignado a un espacio. Referencia al catálogo `recursos` y
// denormaliza nombre/código para mostrarlo sin otra llamada.
const recursoAsignadoSchema = new mongoose.Schema(
  {
    recursoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recurso', required: true },
    codigo: { type: String, required: true },
    nombre: { type: String, required: true },
    cantidad: { type: Number, default: 1, min: 1 },
  },
  { _id: false }
);

// Ubicación separada en sub-documento.
const ubicacionSchema = new mongoose.Schema(
  {
    edificio: { type: String, required: true, trim: true },
    piso: { type: Number, required: true },
    numEscritorio: { type: String, default: null }, // solo aplica a escritorios individuales
  },
  { _id: false }
);

// Reserva embebida en el espacio. Solo se guardan las ACTIVAS
// (programada / progreso). Al finalizar se eliminan de aquí, pero el
// registro completo permanece en la colección `reservas` (booking-service).
const reservaEmbebidaSchema = new mongoose.Schema(
  {
    reservaId: { type: mongoose.Schema.Types.ObjectId, required: true },
    usuario: { type: String, required: true },
    fechaInicio: { type: Date, required: true },
    fechaFin: { type: Date, required: true },
    status: { type: String, enum: ['programada', 'progreso'], required: true },
  },
  { _id: false }
);

const spaceSchema = new mongoose.Schema(
  {
    codigo: { type: String, required: true, unique: true, uppercase: true, trim: true }, // ID legible
    nombre: { type: String, required: true, trim: true },
    tipo: {
      type: String,
      enum: ['sala_juntas', 'escritorio_individual'],
      required: true,
    },
    capacidad: { type: Number, required: true, min: 1 },
    recursos: { type: [recursoAsignadoSchema], default: [] },
    ubicacion: { type: ubicacionSchema, required: true },
    // Nivel de disponibilidad del espacio (derivado de sus reservas activas)
    status: {
      type: String,
      enum: ['alta', 'baja', 'ninguna'],
      default: 'alta',
    },
    // Reservas activas embebidas (programadas / en progreso) de este espacio.
    reservasProgramadas: { type: [reservaEmbebidaSchema], default: [] },
  },
  { timestamps: true, collection: 'spaces' }
);

module.exports = mongoose.model('Space', spaceSchema);
