-- ─────────────────────────────────────────────────────────────────────────────
-- accounts_db  ·  Microservicio Accounts (NeoWallet)
-- Se ejecuta automáticamente la PRIMERA vez que arranca el contenedor Postgres.
-- (Sección 7.1 del documento de requerimientos.)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(100)  NOT NULL,
  email      VARCHAR(100)  UNIQUE NOT NULL,
  balance    DECIMAL(10,2) DEFAULT 0.00 CHECK (balance >= 0),
  created_at TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

-- Mantener updated_at al día en cada UPDATE
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_set_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Datos semilla (sección 7.3 del documento de requerimientos)
INSERT INTO users (name, email, balance) VALUES
  ('Usuario A (Rico)',  'usuario.a@neowallet.com', 1000.00),
  ('Usuario B (Pobre)', 'usuario.b@neowallet.com',   50.00),
  ('Usuario C (Nuevo)', 'usuario.c@neowallet.com',    0.00);
