# Casos de prueba — NeoWallet

Casos de prueba que cubren los requisitos del Escenario 2 (RF/RN/RNF/CU) más las
funcionalidades añadidas (auth, idempotencia, tiempo real). Cada caso es
**trazable** a un requisito y verificable por su código HTTP / efecto esperado.

Los casos automatizables están en la colección Postman
([`postman/NeoWallet.postman_collection.json`](./postman/NeoWallet.postman_collection.json),
ejecutable con Newman) y en las features BDD ([`features/`](./features/)).

## Credenciales y notas

| Usuario | Email | Saldo inicial | Contraseña |
|---------|-------|---------------|------------|
| Usuario A (Rico) | usuario.a@neowallet.com | 1000.00 | neowallet123 |
| Usuario B (Pobre) | usuario.b@neowallet.com | 50.00 | neowallet123 |
| Usuario C (Nuevo) | usuario.c@neowallet.com | 0.00 | neowallet123 |

- Montos en USD con 2 decimales. Los saldos cambian entre ejecuciones; los casos
  que verifican montos comparan **antes/después**, no valores absolutos.
- accounts-service `:3000` · processor-service `:3001`.

---

## 1. Autenticación y autorización (RNF-004)

### CP-01 · Login válido
- **Pasos:** POST `/auth/login` con email y contraseña correctos.
- **Esperado:** `200` + `{ token, user }`; el token es un JWT.

### CP-02 · Login con contraseña incorrecta
- **Pasos:** POST `/auth/login` con contraseña errónea.
- **Esperado:** `401 invalid_credentials` (sin revelar si el email existe).

### CP-03 · Acceso a endpoint protegido sin token
- **Pasos:** GET `/accounts` sin cabecera Authorization.
- **Esperado:** `401 unauthorized`.

### CP-04 · Token inválido
- **Pasos:** GET `/auth/me` con `Authorization: Bearer basura`.
- **Esperado:** `401 invalid_token`.

### CP-05 · Datos del usuario autenticado
- **Pasos:** GET `/auth/me` con token válido.
- **Esperado:** `200` + datos del propio usuario.

---

## 2. Cuentas y saldos (RF-001, RF-002, RN-001, RN-005)

### CP-06 · Consultar el propio saldo
- **Pasos:** GET `/accounts/{idPropio}` con token propio.
- **Esperado:** `200` + saldo con 2 decimales.

### CP-07 · Consultar saldo de otra cuenta
- **Pasos:** GET `/accounts/{idAjeno}` con token propio.
- **Esperado:** `403 forbidden` (autorización por propietario).

### CP-08 · Recarga válida
- **Pasos:** POST `/api/recharge` con monto positivo.
- **Esperado:** `200` + `new_balance` = saldo previo + monto.

### CP-09 · Recarga con monto inválido
- **Pasos:** POST `/api/recharge` con monto ≤ 0 o > 2 decimales.
- **Esperado:** `400 invalid_amount`. Saldo sin cambios.

### CP-10 · Recarga idempotente
- **Pasos:** POST `/api/recharge` dos veces con la **misma** `idempotency_key`.
- **Esperado:** ambas `200`; el saldo aumenta **una sola vez**.

---

## 3. Motor de transferencias (RF-003, RN-002/003/004, CU-001..005)

### CP-11 · Transferencia válida (CU-001)
- **Pasos:** POST `/api/transfer` (receptor válido, monto ≤ saldo).
- **Esperado:** `201` + `status: COMPLETED`; emisor −monto, receptor +monto.

### CP-12 · Auto-transferencia (CU-003, RN-002)
- **Pasos:** transferir a uno mismo.
- **Esperado:** `400 self_transfer_not_allowed`.

### CP-13 · Monto inválido (RN-001)
- **Pasos:** transferir monto ≤ 0 o > 2 decimales.
- **Esperado:** `400 invalid_amount`.

### CP-14 · Fondos insuficientes (CU-002, RN-003)
- **Pasos:** transferir un monto mayor al saldo.
- **Esperado:** `400 insufficient_funds`. Sin cambios en saldos.

### CP-15 · Receptor inexistente
- **Pasos:** transferir a un `receiver_id` que no existe.
- **Esperado:** `404 user_not_found`.

### CP-16 · Transferencia sin sesión
- **Pasos:** POST `/api/transfer` sin token.
- **Esperado:** `401 unauthorized`.

### CP-17 · Spoofing del emisor (seguridad)
- **Pasos:** transferir con token de A pero `sender_id` falso de B en el body.
- **Esperado:** el débito sale de **A** (el del token); el body se ignora.

### CP-18 · Idempotencia de la intención (anti doble-cobro)
- **Pasos:** POST `/api/transfer` dos veces con la **misma** `idempotency_key`.
- **Esperado:** la 2ª devuelve `idempotent_replay: true`; **un solo débito**; una sola fila en `transactions`.

### CP-19 · Doble envío concurrente (carrera)
- **Pasos:** dos POST `/api/transfer` idénticos en paralelo (mismo key).
- **Esperado:** débito total = un monto (no doble); una sola transacción creada.

### CP-20 · Conservación de dinero (RNF-006, CU-005)
- **Pasos:** sumar todos los saldos antes y después de una transferencia.
- **Esperado:** la suma total permanece constante.

---

## 4. Endpoint interno y compensación (RF-004, CU-005)

### CP-21 · update-balance sin clave interna
- **Pasos:** POST `/accounts/update-balance` sin `X-Internal-Key`.
- **Esperado:** `401 unauthorized`.

### CP-22 · update-balance con token de usuario (no interno)
- **Pasos:** POST `/accounts/update-balance` con `Authorization: Bearer` de usuario.
- **Esperado:** `401` (un usuario final no puede mover saldos directamente).

### CP-23 · update-balance idempotente
- **Pasos:** POST `/accounts/update-balance` dos veces con la misma `op_key`.
- **Esperado:** el saldo cambia **una sola vez** (replay idempotente).

---

## 5. Historial (RF-005)

### CP-24 · Historial propio
- **Pasos:** GET `/api/transactions/{idPropio}` con token propio.
- **Esperado:** `200` + lista (enviadas + recibidas), orden descendente, con `type` y `counterparty_id`.

### CP-25 · Historial ajeno
- **Pasos:** GET `/api/transactions/{idAjeno}` con token propio.
- **Esperado:** `403 forbidden`.

---

## 5b. Estados de cuenta / facturación

### CP-30 · Estado de cuenta propio (JSON)
- **Pasos:** GET `/api/statements/{idPropio}` con token propio.
- **Esperado:** `200` + `{ user, current_balance, summary{total_sent,total_received,count}, movements[] }`.

### CP-31 · Estado de cuenta ajeno
- **Pasos:** GET `/api/statements/{idAjeno}` con token propio.
- **Esperado:** `403 forbidden`.

### CP-32 · Estado de cuenta sin token
- **Pasos:** GET `/api/statements/{id}` sin token.
- **Esperado:** `401 unauthorized`.

### CP-33 · Estado de cuenta en PDF (propio)
- **Pasos:** GET `/api/statements/{idPropio}/pdf` con token propio.
- **Esperado:** `200`, `Content-Type: application/pdf`, el cuerpo comienza con `%PDF`.

### CP-34 · Estado de cuenta en PDF (ajeno)
- **Pasos:** GET `/api/statements/{idAjeno}/pdf` con token propio.
- **Esperado:** `403 forbidden`.

---

## 6. Tiempo real (WebSocket)

### CP-26 · Handshake sin token
- **Pasos:** conectar el socket sin `auth.token`.
- **Esperado:** rechazo (`unauthorized` / `invalid_token`).

### CP-27 · Notificación de transferencia entrante
- **Pasos:** B conecta el socket autenticado; A transfiere a B.
- **Esperado:** B recibe `transfer:incoming` con `{ transaction_id, from, amount }`.

---

## 7. Disponibilidad y documentación (RNF-002, bonus)

### CP-28 · Health checks
- **Pasos:** GET `/health` en ambos servicios.
- **Esperado:** `200` + `{ status: "ok", service }`.

### CP-29 · Swagger accesible
- **Pasos:** GET `/api-docs/` en ambos servicios.
- **Esperado:** `200` (UI de OpenAPI).

---

## Trazabilidad (resumen)

| Área | Casos | Requisitos |
|------|-------|------------|
| Autenticación | CP-01..05 | RNF-004 |
| Cuentas/saldos | CP-06..10 | RF-001, RF-002, RN-001/005 |
| Transferencias | CP-11..20 | RF-003, RN-002/003/004, CU-001..005, RNF-006 |
| Interno/compensación | CP-21..23 | RF-004, CU-005 |
| Historial | CP-24..25 | RF-005 |
| Estados de cuenta / facturación | CP-30..34 | (mejora) |
| Tiempo real | CP-26..27 | (mejora) |
| Disponibilidad/docs | CP-28..29 | RNF-002, bonus |
