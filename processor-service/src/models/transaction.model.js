// Modelo / referencia de la tabla `transactions` (processor_db).
// Esquema definido en ../../../shared-infra/processor-init.sql
//
//   id            SERIAL PRIMARY KEY
//   sender_id     INT           NOT NULL
//   receiver_id   INT           NOT NULL
//   amount        DECIMAL(10,2) NOT NULL  CHECK (amount > 0)
//   status        VARCHAR(20)   NOT NULL  DEFAULT 'PENDING'
//   error_message TEXT
//   created_at    TIMESTAMP
//   updated_at    TIMESTAMP

const TABLE = 'transactions';

// Estados válidos del ciclo de vida de una transacción (sección 7.2)
const STATUS = Object.freeze({
  PENDING: 'PENDING',
  DEBITED: 'DEBITED',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  ROLLED_BACK: 'ROLLED_BACK',
});

module.exports = { TABLE, STATUS };
