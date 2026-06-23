# NeoWallet — Escenario 2 (IBM Hackathon 2026)

Sistema de **pagos P2P** (billetera digital). Arquitectura de **microservicios**
con **una base de datos por servicio** (database-per-service) en **PostgreSQL**,
y un **frontend Next.js** con el mismo lenguaje visual que el escenario 1.

Requisitos completos en [`Escenario 2 Requerimientos.md`](./Escenario%202%20Requerimientos.md).

---

## 🏗️ Arquitectura

```
   navegador ──► frontend (Next.js)  :3002
                     │
        ┌────────────┴───────────────┐
        ▼                            ▼
   accounts-service :3000      processor-service :3001
        │                            │   │
        ▼                            ▼   └─HTTP─► accounts-service
   accounts_db (Postgres :5432)  processor_db (Postgres :5433)
```

| Servicio              | Puerto | Rol                                       | BD            |
|-----------------------|--------|-------------------------------------------|---------------|
| **frontend**          | 3002   | UI (selección de usuario, dashboard, etc.)| —             |
| **accounts-service**  | 3000   | Usuarios y saldos                         | accounts_db   |
| **processor-service** | 3001   | Transferencias P2P (patrón Saga)          | processor_db  |
| accounts-db           | 5432   | Postgres (tabla `users`)                  | —             |
| processor-db          | 5433   | Postgres (tabla `transactions`)           | —             |

---

## 🚀 Cómo levantarlo

Requisitos: Docker + Docker Compose.

```bash
cp .env.example .env          # credenciales de la BD (ya trae valores por defecto)
docker compose up --build
```

Luego abre 👉 **http://localhost:3002**

Las bases se inicializan solas con esquema + datos semilla: 3 usuarios
(A=$1000, B=$50, C=$0). Como el escenario **no tiene login**, al entrar eliges
con qué usuario usar la billetera (puedes cambiarlo desde el selector del nav).

### Modo desarrollo (hot reload)

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

> ⚠️ Usa el **puerto 3000** (igual que el frontend del escenario 1). **No corras
> ambos escenarios a la vez.**

---

## 🖥️ Pantallas

- **/** — selección de usuario (no hay registro/login).
- **/wallet** — dashboard: saldo + movimientos recientes.
- **/transfer** — transferencia P2P a otro usuario.
- **/recharge** — recarga de saldo (simulada).
- **/history** — historial de transacciones (enviadas y recibidas).
- **/accounts** — todos los usuarios y el total de dinero en el sistema.

---

## 🔌 API

**accounts-service** (`:3000`)
- `GET  /accounts`                 — lista de usuarios
- `GET  /accounts/:userId`         — consultar saldo (RF-001)
- `POST /api/recharge`             — recargar saldo (RF-002)
- `POST /accounts/update-balance`  — débito/crédito interno y atómico (RF-004)

**processor-service** (`:3001`)
- `POST /api/transfer`             — transferencia P2P con Saga (RF-003)
- `GET  /api/transactions/:userId` — historial (RF-005)

Cada servicio expone `GET /health`.

---

## ✅ Reglas de negocio implementadas

- Validación de montos (positivos, ≤ 2 decimales) — RN-001 / RN-005.
- Prevención de auto-transferencias — RN-002.
- Verificación de fondos suficientes — RN-003.
- **Conservación del dinero**: la suma total es constante; en fallos no se crea
  ni se destruye dinero — RN-004 / RNF-006.
- Saldo nunca negativo (`CHECK (balance >= 0)`) — RN-006.
- **Patrón Saga con compensación**: si falla el crédito al receiver, se revierte
  el débito del sender y la transacción queda `ROLLED_BACK` — CU-005.
- Estados de transacción: `PENDING → DEBITED → COMPLETED` / `FAILED` / `ROLLED_BACK`.
- Consultas parametrizadas (anti SQL-injection) — RNF-004.
- Health checks por servicio — RNF-002.

---

## 📂 Estructura

```
frontend/             ← Next.js (mismo diseño que el escenario 1)
  src/app/            ← páginas + loading.js (spinners de navegación)
  src/components/     ← Nav, Toast, PageLoader, WalletGuard
  src/services/api.js ← clientes HTTP a los microservicios
accounts-service/  processor-service/
  src/
    config/db.js        ← pool de conexión a Postgres
    routes/ controllers/ services/ models/   ← MVC
shared-infra/
  accounts-init.sql   processor-init.sql     ← esquema + seed
docker-compose.yml      docker-compose.dev.yml
```
