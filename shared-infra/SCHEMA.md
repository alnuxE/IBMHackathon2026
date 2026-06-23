# Esquema de datos — NeoWallet

Modelo de datos del sistema. Sigue el principio **database-per-service**: cada
microservicio es dueño de su base de datos y nadie más la consulta directamente.

## Bases de datos

| Base de datos | Dueño | Motor | Tablas |
|---------------|-------|-------|--------|
| `accounts_db` (:5432) | accounts-service | PostgreSQL 16 | `users`, `applied_operations` |
| `processor_db` (:5433) | processor-service | PostgreSQL 16 | `transactions` |

## Diagrama de relaciones (lógico)

No hay claves foráneas entre bases (están separadas): la relación es **lógica**,
resuelta por HTTP entre servicios.

```
  accounts_db                                  processor_db
  ┌─────────────────────────────┐              ┌────────────────────────────────┐
  │ users                       │              │ transactions                   │
  │  id            SERIAL  PK    │◄────lógico───┤  sender_id    INT              │
  │  name          VARCHAR(100)  │   (HTTP)  ┌──┤  receiver_id  INT              │
  │  email         VARCHAR(100)U │◄──────────┘  │  id           SERIAL  PK       │
  │  balance       DECIMAL(10,2) │              │  amount       DECIMAL(10,2)    │
  │  password_hash VARCHAR(255)  │              │  status       VARCHAR(20)      │
  │  created_at / updated_at     │              │  idempotency_key VARCHAR(64) U │
  └─────────────────────────────┘              │  error_message TEXT            │
  ┌─────────────────────────────┐              │  created_at / updated_at       │
  │ applied_operations (ledger) │              └────────────────────────────────┘
  │  op_key   VARCHAR(80)  PK    │   op_key referencia lógica: "tx{transactions.id}:debit"
  │  user_id  INT  → users.id    │
  │  operation/amount            │
  │  previous_balance/new_balance│
  └─────────────────────────────┘
        U = UNIQUE
```

## Tablas

### `users` (accounts_db)

| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | SERIAL PK | identificador |
| `name` | VARCHAR(100) NOT NULL | nombre |
| `email` | VARCHAR(100) UNIQUE NOT NULL | login |
| `balance` | DECIMAL(10,2) DEFAULT 0.00 | `CHECK (balance >= 0)` |
| `password_hash` | VARCHAR(255) | hash bcrypt (lo siembra el servicio al arrancar) |
| `created_at`, `updated_at` | TIMESTAMP | `updated_at` se mantiene con un trigger |

### `applied_operations` (accounts_db) — ledger de idempotencia/auditoría

Registra **cada** movimiento de saldo. Es el libro que hace la conservación de
dinero *demostrable* y la base de la idempotencia.

| Columna | Tipo | Notas |
|---------|------|-------|
| `op_key` | VARCHAR(80) PK | clave única de la operación (`tx{n}:debit`, `recharge:{uuid}`, …) |
| `user_id` | INT NOT NULL | usuario afectado |
| `operation` | VARCHAR(20) | `debit` / `credit` |
| `amount` | DECIMAL(10,2) | monto del movimiento |
| `previous_balance` / `new_balance` | DECIMAL(10,2) | saldo antes/después (auditoría) |
| `created_at` | TIMESTAMP | |

### `transactions` (processor_db)

| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | SERIAL PK | identificador de la transferencia |
| `sender_id` | INT NOT NULL | emisor (id del usuario del token) |
| `receiver_id` | INT NOT NULL | receptor |
| `amount` | DECIMAL(10,2) | `CHECK (amount > 0)` |
| `status` | VARCHAR(20) | `CHECK IN (PENDING, DEBITED, COMPLETED, FAILED, ROLLED_BACK)` |
| `idempotency_key` | VARCHAR(64) | UNIQUE (permite múltiples NULL); anti-duplicado |
| `error_message` | TEXT | causa del fallo/reversión |
| `created_at`, `updated_at` | TIMESTAMP | |

## Notas de diseño

- **Dinero como `DECIMAL`, no `float`**: evita errores de punto flotante.
- **`CHECK (balance >= 0)`**: impide saldos negativos a nivel de motor, como red
  de seguridad independiente del código.
- **El processor no escribe en `users`**: mueve saldos llamando al accounts-service
  por HTTP (database-per-service).
- **`applied_operations` es append-only por diseño**: nunca se actualiza, solo se
  inserta; un `op_key` repetido = replay idempotente (no se aplica de nuevo).
- **`idempotency_key` UNIQUE con NULLs**: Postgres permite varios NULL en un índice
  único, así conviven transferencias con y sin clave.

## Índices

- `users (email)` — UNIQUE (login).
- `applied_operations (op_key)` — PK (lookup idempotente).
- `transactions (sender_id)` y `transactions (receiver_id)` — historial por usuario (RF-005).
- `transactions (idempotency_key)` — UNIQUE (anti reintento duplicado).

## Inicialización y migraciones

- `shared-infra/accounts-init.sql` y `processor-init.sql` crean el esquema y los
  datos semilla la **primera** vez que arranca cada Postgres.
- Al arrancar, cada servicio ejecuta migraciones idempotentes (`config/migrate.js`)
  que añaden columnas/tablas/índices que falten (`password_hash`,
  `applied_operations`, `idempotency_key`) y siembran contraseñas por defecto.
  Esto hace que el sistema funcione también sobre bases ya existentes.

## Datos semilla

| id | name | email | balance |
|----|------|-------|---------|
| 1 | Usuario A (Rico) | usuario.a@neowallet.com | 1000.00 |
| 2 | Usuario B (Pobre) | usuario.b@neowallet.com | 50.00 |
| 3 | Usuario C (Nuevo) | usuario.c@neowallet.com | 0.00 |

Contraseña por defecto de los tres: `neowallet123` (configurable con `SEED_PASSWORD`).
