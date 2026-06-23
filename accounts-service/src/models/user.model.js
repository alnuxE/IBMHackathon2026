// Modelo / referencia de la tabla `users` (accounts_db).
// Esquema definido en ../../../shared-infra/accounts-init.sql
//
//   id          SERIAL PRIMARY KEY
//   name        VARCHAR(100)  NOT NULL
//   email       VARCHAR(100)  UNIQUE NOT NULL
//   balance     DECIMAL(10,2) DEFAULT 0.00  CHECK (balance >= 0)
//   created_at  TIMESTAMP
//   updated_at  TIMESTAMP
//
// Mantener este archivo como punto único de referencia del esquema ayuda a la
// mantenibilidad (RNF-005). Puedes agregar aquí helpers de mapeo si los necesitas.

const TABLE = 'users';
const COLUMNS = ['id', 'name', 'email', 'balance', 'created_at', 'updated_at'];

module.exports = { TABLE, COLUMNS };
