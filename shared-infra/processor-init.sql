-- ─────────────────────────────────────────────────────────────────────────────
-- processor_db  ·  Microservicio Processor (NeoWallet)
-- Se ejecuta automáticamente la PRIMERA vez que arranca el contenedor Postgres.
-- (Sección 7.2 del documento de requerimientos.)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS transactions (
  id              SERIAL PRIMARY KEY,
  sender_id       INT           NOT NULL,
  receiver_id     INT           NOT NULL,
  amount          DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  status          VARCHAR(20)   NOT NULL DEFAULT 'PENDING',
  idempotency_key VARCHAR(64),  -- clave de la intención del cliente (anti-duplicado)
  error_message   TEXT,
  created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_status CHECK (status IN ('PENDING', 'DEBITED', 'COMPLETED', 'FAILED', 'ROLLED_BACK'))
);

-- Índices útiles para el historial por usuario (RF-005)
CREATE INDEX IF NOT EXISTS idx_transactions_sender   ON transactions (sender_id);
CREATE INDEX IF NOT EXISTS idx_transactions_receiver ON transactions (receiver_id);

-- Una intención del cliente = una sola transferencia (reintentos no duplican).
-- Postgres permite múltiples NULL en un índice único (transferencias sin clave).
CREATE UNIQUE INDEX IF NOT EXISTS uq_transactions_idempotency
  ON transactions (idempotency_key);

-- Mantener updated_at al día en cada UPDATE
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER transactions_set_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
