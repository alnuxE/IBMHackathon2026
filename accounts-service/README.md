# accounts-service

Microservicio de **cuentas y autenticación** de NeoWallet.
**Puerto:** 3000 · **Base de datos:** `accounts_db` (PostgreSQL) · tablas `users`, `applied_operations`.

Es el **dueño de los usuarios y los saldos**, y el **servidor de autenticación**
(emite los JWT). Es el único servicio que escribe en la tabla `users`.

## Endpoints

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/auth/login` | — | Login → `{ token, user }` |
| GET | `/auth/me` | Bearer | Usuario autenticado |
| GET | `/accounts` | Bearer | Directorio (sin saldos) |
| GET | `/accounts/{userId}` | Bearer / interno | Saldo (solo el propio) |
| POST | `/api/recharge` | Bearer | Recarga la propia cuenta (idempotente) |
| POST | `/accounts/update-balance` | 🔑 `X-Internal-Key` | Débito/crédito atómico e idempotente |
| GET | `/health` | — | Estado |
| GET | `/api-docs` | — | Swagger UI (OpenAPI 3.0) |

## Respuesta de login

```json
{ "token": "eyJhbGciOi...", "user": { "id": 1, "name": "Usuario A (Rico)", "email": "usuario.a@neowallet.com", "balance": 1000 } }
```

Payload del JWT: `{ sub: <id>, email, name, exp }`.

## Lógica clave

- **`updateBalance(userId, amount, operation, opKey)`** — atómico (`BEGIN` +
  `SELECT … FOR UPDATE` + `COMMIT`) e **idempotente**: si `opKey` ya existe en
  `applied_operations`, devuelve el resultado guardado sin volver a aplicar.
- **Migración al arrancar** (`config/migrate.js`): garantiza `password_hash` y
  `applied_operations`, y siembra la contraseña por defecto.
- **Arranque seguro** (`config/auth.js`): hard-fail en producción si los secretos
  son los de desarrollo.

## Variables de entorno

| Variable | Por defecto | Descripción |
|----------|-------------|-------------|
| `PORT` | 3000 | puerto |
| `DB_HOST/PORT/NAME/USER/PASSWORD` | — | conexión Postgres |
| `JWT_SECRET` | dev-secret-change-me | secreto del JWT (compartido con processor) |
| `JWT_EXPIRES_IN` | 12h | expiración del token |
| `INTERNAL_API_KEY` | dev-internal-key | clave servicio-a-servicio |
| `SEED_PASSWORD` | neowallet123 | contraseña inicial de los usuarios semilla |

## Ejecutar en local

```bash
npm install
npm run dev      # node --watch server.js
```

> Normalmente se levanta con `docker compose up` desde la raíz. Ver Swagger en
> http://localhost:3000/api-docs.
