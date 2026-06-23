# NeoWallet — Escenario 2 (IBM Hackathon 2026)

Sistema de **pagos P2P** (billetera digital). Arquitectura de **microservicios**
con **una base de datos por servicio** (database-per-service), en **PostgreSQL**.

Requisitos completos en [`Escenario 2 Requerimientos.md`](./Escenario%202%20Requerimientos.md).

---

## 🏗️ Arquitectura

```
   cliente ──HTTP──► accounts-service  :3000 ──► accounts_db   (Postgres :5432)
                         ▲
                         │ HTTP (débito/crédito)
                         │
   cliente ──HTTP──► processor-service :3001 ──► processor_db  (Postgres :5433)
```

| Servicio              | Puerto | Rol                                | BD            |
|-----------------------|--------|------------------------------------|---------------|
| **accounts-service**  | 3000   | Usuarios y saldos                  | accounts_db   |
| **processor-service** | 3001   | Transferencias P2P (patrón Saga)   | processor_db  |
| accounts-db           | 5432   | Postgres (tabla `users`)           | —             |
| processor-db          | 5433   | Postgres (tabla `transactions`)    | —             |

---

## 🚀 Cómo levantarlo

Requisitos: Docker + Docker Compose.

```bash
cp .env.example .env          # credenciales de la BD (ya trae valores por defecto)
docker compose up --build
```

Las bases se inicializan solas con el esquema + datos semilla
(`shared-infra/*.sql`): 3 usuarios de ejemplo (A=$1000, B=$50, C=$0).

### Modo desarrollo (hot reload, sin reconstruir)

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

> ⚠️ Este escenario usa el **puerto 3000**, igual que el frontend del escenario 1
> (OfficeSpace). **No corras ambos a la vez.**

---

## 🔌 Endpoints

**accounts-service** (`:3000`)
- `GET  /accounts/:userId`         — consultar saldo (RF-001)
- `POST /api/recharge`             — recargar saldo (RF-002)
- `POST /accounts/update-balance`  — débito/crédito interno (RF-004)

**processor-service** (`:3001`)
- `POST /api/transfer`             — transferencia P2P (RF-003)
- `GET  /api/transactions/:userId` — historial, bonus (RF-005)

Cada servicio expone `GET /health`.

---

## 🧩 Estado actual (esqueleto)

✅ Listo: bases de datos con esquema + seed, conexión, estructura MVC,
ruteo, health checks, comunicación HTTP entre servicios y modo dev.

🚧 **Por implementar (la lógica de negocio):** los controladores y services
están marcados con `TODO` y devuelven `501 Not Implemented`. Ahí escribes la
lógica. Empieza por:

1. `accounts-service` → `getById` / `recharge` / `updateBalance`
2. `processor-service` → `transfer` (patrón Saga con compensación) / `getHistory`

Cada `TODO` incluye el flujo sugerido y ejemplos de query parametrizada.

---

## 📂 Estructura

```
accounts-service/   processor-service/
  src/
    config/db.js        ← pool de conexión a Postgres
    routes/             ← define los endpoints
    controllers/        ← validación + códigos HTTP   (TODO)
    services/           ← lógica de negocio + SQL     (TODO)
    models/             ← referencia del esquema
  Dockerfile  server.js
shared-infra/
  accounts-init.sql   processor-init.sql   ← esquema + seed
docker-compose.yml      docker-compose.dev.yml
```
