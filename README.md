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
(A=$1000, B=$50, C=$0). El sistema tiene **login con JWT**: entra con el email de
un usuario y la contraseña por defecto.

**Credenciales de demo** (contraseña `neowallet123` para los tres):

| Usuario | Email | Saldo |
|---------|-------|-------|
| Usuario A (Rico)  | `usuario.a@neowallet.com` | $1000 |
| Usuario B (Pobre) | `usuario.b@neowallet.com` |   $50 |
| Usuario C (Nuevo) | `usuario.c@neowallet.com` |    $0 |

> La contraseña por defecto se configura con `SEED_PASSWORD` en `.env`. El
> secreto del JWT (`JWT_SECRET`) y la clave interna (`INTERNAL_API_KEY`) también
> viven ahí — **cámbialos en producción**.
>
> ⚠️ Si añades dependencias (este cambio agrega `bcryptjs` y `jsonwebtoken`),
> reconstruye las imágenes con `docker compose up --build`.

### Modo desarrollo (hot reload)

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

> ⚠️ Usa el **puerto 3000** (igual que el frontend del escenario 1). **No corras
> ambos escenarios a la vez.**

---

## 🖥️ Pantallas

- **/** — login (email + contraseña). Las demás rutas exigen sesión.
- **/wallet** — dashboard: saldo + movimientos recientes.
- **/transfer** — transferencia P2P a otro usuario.
- **/recharge** — recarga de saldo (simulada).
- **/history** — historial de transacciones (enviadas y recibidas).
- **/accounts** — directorio de usuarios (sin saldos de terceros).

---

## 🔌 API

**accounts-service** (`:3000`)
- `POST /auth/login`               — login con email+contraseña → `{ token, user }`
- `GET  /auth/me`                  — datos del usuario logueado 🔒
- `GET  /accounts`                 — directorio de usuarios (sin saldos) 🔒
- `GET  /accounts/:userId`         — consultar saldo (RF-001) 🔒 *solo el propio*
- `POST /api/recharge`             — recargar saldo (RF-002) 🔒 *solo la propia cuenta*
- `POST /accounts/update-balance`  — débito/crédito interno y atómico (RF-004) 🔑 *interno*

**processor-service** (`:3001`)
- `POST /api/transfer`             — transferencia P2P con Saga (RF-003) 🔒 *sender = usuario del token*
- `GET  /api/transactions/:userId` — historial (RF-005) 🔒 *solo el propio*

🔒 requiere `Authorization: Bearer <token>` · 🔑 requiere header `X-Internal-Key`
(servicio-a-servicio). Cada servicio expone `GET /health` (público).

**Documentación interactiva (Swagger / OpenAPI 3.0):**

| Servicio | Swagger UI |
|----------|------------|
| accounts-service | http://localhost:3000/api-docs |
| processor-service | http://localhost:3001/api-docs |

Contrato detallado en [`docs/API_CONTRACT.md`](./docs/API_CONTRACT.md).

---

## 📚 Documentación

| Documento | Contenido |
|-----------|-----------|
| [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) | Decisiones de arquitectura, seguridad, resiliencia, diagramas |
| [`docs/API_CONTRACT.md`](./docs/API_CONTRACT.md) | Endpoints, reglas de negocio, ejemplos curl, eventos WebSocket |
| [`shared-infra/SCHEMA.md`](./shared-infra/SCHEMA.md) | Modelo de datos (tablas, relaciones, índices) |
| READMEs por servicio | [accounts](./accounts-service/README.md) · [processor](./processor-service/README.md) · [frontend](./frontend/README.md) |

## ▶️ Flujo de prueba rápido

1. `docker compose up --build` y abre http://localhost:3002
2. Entra como **Usuario A** (`usuario.a@neowallet.com` / `neowallet123`).
3. En **Transferir**, envía $100 al Usuario B.
4. (Opcional) Abre otra pestaña/dispositivo como **Usuario B**: verás la
   transferencia llegar **en vivo** (WebSocket).
5. En **Historial** y **Recargar** comprueba el movimiento y agrega saldo.

---

## 🔐 Autenticación y autorización

- **Login con JWT**: `accounts-service` emite el token; el frontend lo guarda y
  lo envía en cada petición. El secreto (`JWT_SECRET`) es compartido para que
  `processor-service` también pueda verificar el token (stateless).
- **Rutas protegidas** en frontend (`WalletGuard`) **y backend** (middlewares).
- **Autorización por propietario**: un usuario solo puede ver su saldo/historial
  y solo puede transferir/recargar sobre **su propia** cuenta (el `id` se toma
  del token, nunca del body → no se puede operar sobre otra cuenta).
- **Endpoint interno** `update-balance` protegido con `INTERNAL_API_KEY`
  (servicio-a-servicio): un usuario final no puede llamarlo.
- Contraseñas con **hash bcrypt**; el token expira (`JWT_EXPIRES_IN`, 12h por
  defecto) y un `401` cierra la sesión en el frontend automáticamente.

## 🌐 Acceso en red local (LAN)

Otros dispositivos de tu red pueden usar la billetera entrando a la **IP de la
laptop**: 👉 `http://<IP-DE-LA-LAP>:3002` (p. ej. `http://172.18.30.218:3002`).

El frontend deriva la URL del backend del host del navegador (no está "horneada"
a `localhost`), así que funciona por IP sin reconstruir. Requisitos: los
dispositivos en la **misma red** y el firewall permitiendo los puertos 3000-3002.
Averigua tu IP con `hostname -I`.

> ⚠️ En LAN el JWT viaja en **HTTP plano**. Aceptable en una red de confianza
> para demo; en producción usar HTTPS/TLS.

## ⚡ Tiempo real (WebSocket / Socket.IO)

El `processor-service` expone un **gateway WebSocket** (mismo puerto 3001) para la
sensación "P2P en vivo" — de forma **segura**: el servidor sigue siendo la única
autoridad y solo *empuja notificaciones*.

- El handshake se **autentica con el mismo JWT** que la API REST.
- Cada usuario se une solo a **su** room (`user:<id>`) → no puede espiar a otros.
- Al completarse una transferencia, el **receptor ve entrar el dinero en vivo**
  (evento `transfer:incoming`) y sus saldos/historial se refrescan sin recargar.

Abre la app en dos dispositivos (o dos pestañas) con usuarios distintos:
transfiere de A→B y verás la notificación llegar a B al instante.

## 🛡️ Resiliencia ante fallos de red (idempotencia)

El riesgo de un Saga por HTTP es la **ambigüedad del timeout**: un error de red
puede significar "no se aplicó" *o* "se aplicó pero se perdió la respuesta".
Asumir lo primero destruye, crea o duplica dinero. Mitigaciones implementadas:

- **Idempotencia de la intención** — `POST /api/transfer` acepta `idempotency_key`.
  Un reintento del mismo POST **no crea una segunda transferencia** (índice único
  + `ON CONFLICT`); devuelve el estado de la original (`idempotent_replay`).
- **Idempotencia de cada movimiento de saldo** — cada leg (`debit`/`credit`/
  `compensate`) lleva una `op_key` estable (`tx{id}:debit`, …). El accounts-service
  registra cada operación en el ledger `applied_operations` y **no la aplica dos
  veces**. Resuelve la ambigüedad: reintentar es seguro.
- **Reintentos con backoff** ante timeouts/5xx (no ante 4xx, que son definitivos).
- **Ledger de auditoría** (`applied_operations`) → la conservación de dinero es
  *demostrable*, incluida la procedencia de las recargas (RNF-006). Las recargas
  también son idempotentes.
- **Arranque seguro de secretos** — en `NODE_ENV=production`, el servicio **se
  niega a arrancar** si `JWT_SECRET`/`INTERNAL_API_KEY` están vacíos o usan el
  valor por defecto (en dev solo emite un warning).

> **Pendiente recomendado (no incluido):** un *job de reconciliación* que cierre
> transacciones que quedaron `DEBITED`/`rollback_unconfirmed` si la red estuvo
> caída más allá de los reintentos, y un *API gateway* para no exponer los
> microservicios directamente al navegador. El ledger idempotente ya deja ese
> cierre **seguro y sin doble cobro**.

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
  src/app/page.js     ← login; resto de páginas protegidas + loading.js
  src/components/     ← Nav, Toast, PageLoader, WalletGuard
  src/services/api.js ← clientes HTTP (envían el JWT) + authApi
  src/utils/wallet.js ← sesión (token + usuario) en localStorage
accounts-service/  processor-service/
  src/
    config/db.js        ← pool de conexión a Postgres
    config/auth.js      ← JWT (firmar/verificar) + clave interna
    config/migrate.js   ← (accounts) columna password_hash + seed de contraseñas
    middlewares/        ← auth.middleware.js (requireUser / authenticate / requireInternal)
    routes/ controllers/ services/ models/   ← MVC (incluye auth.* en accounts)
shared-infra/
  accounts-init.sql   processor-init.sql     ← esquema + seed
docker-compose.yml      docker-compose.dev.yml
```
