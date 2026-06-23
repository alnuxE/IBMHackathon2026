const mongoose = require('mongoose');

const reservaSchema = new mongoose.Schema(
  {
    // Referencia al espacio (vive en catalog-service). Se guarda el id como string.
    spaceId: { type: String, required: true, index: true },
    spaceCodigo: { type: String },   // copia denormalizada (ID legible del espacio)
    spaceNombre: { type: String },   // copia denormalizada para mostrar

    fechaInicio: { type: Date, required: true },
    fechaFin: { type: Date, required: true },

    // Nº de personas que asistirán (no puede exceder la capacidad del espacio)
    asistentes: { type: Number, required: true, min: 1 },

    // Usuario que reservó (del JWT)
    userId: { type: String, required: true, index: true },
    usuario: { type: String, required: true },

    // Ciclo de vida: programada -> progreso -> finalizada (cancelada si se anula)
    status: {
      type: String,
      enum: ['programada', 'progreso', 'finalizada', 'cancelada'],
      default: 'programada',
    },
  },
  { timestamps: true, collection: 'reservas' }
);

module.exports = mongoose.model('Reserva', reservaSchema);
