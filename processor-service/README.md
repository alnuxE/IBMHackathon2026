# processor-service

Microservicio de **procesamiento de transferencias P2P** de NeoWallet.
**Puerto:** 3001 (HTTP + WebSocket) · **Base de datos:** `processor_db` (PostgreSQL) · tabla `transactions`.

Orquesta las transferencias con el patrón **Saga** y expone un **gateway WebSocket**
para notificaciones en tiempo real. **No toca la tabla `users`**: mueve saldos
llamando al `accounts-service` por HTTP.

## Endpoints

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/transfer` | Bearer | Transferencia P2P (Saga, idempotente) |
| GET | `/api/transactions/{userId}` | Bearer | Historial propio |
| GET | `/health` | — | Estado |
| GET | `/api-docs` | — | Swagger UI (OpenAPI 3.0) |

## Lógica clave (Saga resiliente)

1. Crea la transacción `PENDING` (idempotente por `idempotency_key`).
2. Verifica que el receptor exista.
3. **Debita** al emisor → `DEBITED` (op_key `tx{id}:debit`).
4. **Acredita** al receptor → `COMPLETED` (op_key `tx{id}:credit`).
5. Si el crédito falla → **compensa** devolviendo al emisor → `ROLLED_BACK`.

- Cada llamada al accounts-service es **idempotente** (op_key por leg) y se
  **reintenta con backoff** ante timeouts/5xx → resuelve la ambigüedad de la red
  sin doble cobro.
- El `sender_id` se toma **del token**, no del body.

## Tiempo real (WebSocket)

`src/realtime.js` levanta Socket.IO sobre el mismo servidor HTTP. Handshake
autenticado con JWT; cada usuario en su room `user:{id}`. Al completarse una
transferencia se emite `transfer:incoming` (receptor) y `transfer:completed` (emisor).

## Variables de entorno

| Variable | Por defecto | Descripción |
|----------|-------------|-------------|
| `PORT` | 3001 | puerto |
| `DB_HOST/PORT/NAME/USER/PASSWORD` | — | conexión Postgres |
| `ACCOUNTS_SERVICE_URL` | http://localhost:3000 | URL del accounts-service |
| `JWT_SECRET` | dev-secret-change-me | secreto del JWT (debe coincidir con accounts) |
| `INTERNAL_API_KEY` | dev-internal-key | clave que envía en `X-Internal-Key` |

## Ejecutar en local

```bash
npm install
npm run dev
```

> Swagger en http://localhost:3001/api-docs. Requiere que `accounts-service` esté
> disponible para procesar transferencias.
