const mongoose = require('mongoose');

// Catálogo dinámico de recursos (proyector, monitor, mouse, pantalla, etc.).
// El administrador puede dar de alta nuevos recursos; los espacios los referencian.
const recursoSchema = new mongoose.Schema(
  {
    codigo: { type: String, required: true, unique: true, uppercase: true, trim: true },
    nombre: { type: String, required: true, trim: true },
    categoria: { type: String, trim: true }, // audiovisual, mobiliario, conectividad, ...
    descripcion: { type: String, trim: true },
    activo: { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'recursos' }
);

module.exports = mongoose.model('Recurso', recursoSchema);
