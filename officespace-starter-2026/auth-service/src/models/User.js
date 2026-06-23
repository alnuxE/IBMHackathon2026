const mongoose = require('mongoose');
const { ROLE_VALUES, ROLES } = require('../constants/roles');

const userSchema = new mongoose.Schema(
  {
    // `usuario` es el identificador de inicio de sesión (correo corporativo)
    usuario: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    rol: { type: String, enum: ROLE_VALUES, default: ROLES.COLABORADOR },
  },
  { timestamps: true, collection: 'users' }
);

// No exponer el hash al serializar
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

module.exports = mongoose.model('User', userSchema);

