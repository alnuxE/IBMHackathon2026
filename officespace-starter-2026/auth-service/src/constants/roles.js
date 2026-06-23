// Apartado de ROLES del sistema.
// Solo existen dos roles: ADMINISTRADOR y COLABORADOR.
const ROLES = Object.freeze({
  ADMINISTRADOR: 'ADMINISTRADOR',
  COLABORADOR: 'COLABORADOR',
});

// Lista de valores válidos (para el enum del modelo y validaciones)
const ROLE_VALUES = Object.values(ROLES);

module.exports = { ROLES, ROLE_VALUES };
