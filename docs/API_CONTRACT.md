# Contrato de API — NeoWallet

Especificación de los endpoints REST y los eventos en tiempo real. Dirigido a
desarrolladores frontend, integradores y testers.

Documentación interactiva (OpenAPI 3.0):

| Servicio | Swagger UI |
|----------|------------|
| accounts-service | http://localhost:3000/api-docs |
| processor-service | http://localhost:3001/api-docs |

## Autenticación

Salvo el login y los `health`, **todos los endpoints exigen** la cabecera:

```
Authorization: Bearer <token-jwt>
```

El endpoint interno `update-balance` no usa JWT de usuario, sino la cabecera
`X-Internal-Key: <clave>` (comunicación servicio-a-servicio).

**Códigos HTTP usados:** `200` OK · `201` creado · `400` input inválido ·
`401` no autenticado · `403` prohibido (cuenta ajena) · `404` no existe ·
`409` conflicto (revertida / en curso) · `500` error interno · `502` servicio no disponible.

---

## accounts-service (`:3000`)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/auth/login` | — | Login con email + contraseña → `{ token, user }` |
| GET | `/auth/me` | Bearer | Datos del usuario autenticado |
| GET | `/accounts` | Bearer | Directorio de usuarios (id, nombre, email; **sin saldos**) |
| GET | `/accounts/{userId}` | Bearer / interno | Saldo de una cuenta (solo la propia; interno: cualquiera) |
| POST | `/api/recharge` | Bearer | Recarga la **propia** cuenta (idempotente) |
| POST | `/accounts/update-balance` | 🔑 interno | Débito/crédito atómico e idempotente |
| GET | `/health` | — | Estado del servicio |

### Reglas de negocio (accounts)

| Regla | Respuesta si falla |
|-------|--------------------|
| Monto positivo, ≤ 2 decimales | `400 invalid_amount` |
| La cuenta consultada/recargada es la propia | `403 forbidden` |
| Usuario existe | `404 user_not_found` |
| Fondos suficientes (en débito) | `400 insufficient_funds` |
| `operation` ∈ {debit, credit} | `400 invalid_operation` |

### Ejemplos

```bash
# Login (devuelve el token)
curl -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"usuario.a@neowallet.com","password":"neowallet123"}'

# Consultar el propio saldo
curl http://localhost:3000/accounts/1 -H "Authorization: Bearer $TOKEN"

# Recargar saldo (idempotente)
curl -X POST http://localhost:3000/api/recharge \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"amount":100,"payment_method":"card","idempotency_key":"abc-123"}'
```

---

## processor-service (`:3001`)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/transfer` | Bearer | Transferencia P2P (Saga). El emisor es el usuario del token |
| GET | `/api/transactions/{userId}` | Bearer | Historial propio (enviadas + recibidas) |
| GET | `/api/statements/{userId}` | Bearer | Estado de cuenta propio (JSON): resumen + movimientos |
| GET | `/api/statements/{userId}/pdf` | Bearer | Estado de cuenta propio en **PDF** (descarga) |
| GET | `/health` | — | Estado del servicio |

### Reglas de negocio (processor)

| Regla | Respuesta si falla |
|-------|--------------------|
| `receiver_id` válido | `400 invalid_id` |
| Emisor ≠ receptor | `400 self_transfer_not_allowed` |
| Monto positivo, ≤ 2 decimales | `400 invalid_amount` |
| Receptor existe | `404 user_not_found` |
| Fondos suficientes | `400 insufficient_funds` |
| Crédito falla → se revierte el débito | `409 rolled_back` |
| El historial consultado es el propio | `403 forbidden` |

### Idempotencia

`POST /api/transfer` acepta `idempotency_key`. Un reintento con la misma clave
**no crea una segunda transferencia**: devuelve el estado de la original
(`idempotent_replay: true`). Recomendado siempre desde el cliente.

### Ejemplos

```bash
# Transferir $100 al usuario 2 (el emisor sale del token, no del body)
curl -X POST http://localhost:3001/api/transfer \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"receiver_id":2,"amount":100,"idempotency_key":"trf-2026-0001"}'
# → 201 {"transaction_id":1,"status":"COMPLETED"}

# Historial propio
curl http://localhost:3001/api/transactions/1 -H "Authorization: Bearer $TOKEN"
```

---

## Tiempo real (WebSocket · Socket.IO)

El `processor-service` expone un gateway WebSocket en el **mismo puerto 3001**.

- **Handshake:** `io(url, { auth: { token: <jwt> } })`. Sin token válido → rechazo (`unauthorized` / `invalid_token`).
- **Rooms:** cada usuario se une automáticamente a `user:{id}`; no puede recibir eventos de otros.

| Evento | Receptor | Payload |
|--------|----------|---------|
| `transfer:incoming` | receptor de la transferencia | `{ transaction_id, from, amount }` |
| `transfer:completed` | emisor de la transferencia | `{ transaction_id, to, amount }` |

```js
import { io } from 'socket.io-client';
const socket = io('http://localhost:3001', { auth: { token } });
socket.on('transfer:incoming', (p) => console.log('Recibiste', p.amount));
```
