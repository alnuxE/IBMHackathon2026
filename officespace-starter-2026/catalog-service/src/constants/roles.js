// Apartado de ROLES (compartido en cada servicio para no acoplarlos).
// Solo existen dos roles: ADMINISTRADOR y COLABORADOR.
const ROLES = Object.freeze({
  ADMINISTRADOR: 'ADMINISTRADOR',
  COLABORADOR: 'COLABORADOR',
});

const ROLE_VALUES = Object.values(ROLES);

module.exports = { ROLES, ROLE_VALUES };
