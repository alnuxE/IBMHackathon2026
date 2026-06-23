// Apartado de ROLES (compartido en cada servicio para no acoplarlos).
const ROLES = Object.freeze({
  ADMINISTRADOR: 'ADMINISTRADOR',
  COLABORADOR: 'COLABORADOR',
});

const ROLE_VALUES = Object.values(ROLES);

module.exports = { ROLES, ROLE_VALUES };
