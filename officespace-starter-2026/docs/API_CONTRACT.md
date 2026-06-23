# Contrato de API — OfficeSpace

Documentación interactiva (Swagger UI) por servicio:
- auth-service → http://localhost:4000/api-docs
- catalog-service → http://localhost:4001/api-docs
- booking-service → http://localhost:4002/api-docs

**Autenticación:** todas las rutas (excepto `POST /auth/login` y los `/health`)
requieren cabecera `Authorization: Bearer <JWT>`.

Códigos de respuesta usados: `200, 201, 204, 400, 401, 403, 404, 409, 500`.

---

## auth-service (`:4000`)

| Método | Ruta            | Auth          | Descripción                         |
|--------|-----------------|---------------|-------------------------------------|
| POST   | `/auth/login`   | —             | Login → `{ user, token }`           |
| GET    | `/users`        | ADMINISTRADOR | Listar usuarios                     |
| POST   | `/users`        | ADMINISTRADOR | Crear `{ usuario, password, rol }`  |
| PUT    | `/users/:id`    | ADMINISTRADOR | Actualizar `{ rol?, password? }`    |
| DELETE | `/users/:id`    | ADMINISTRADOR | Eliminar usuario                    |
| GET    | `/health`       | —             | Healthcheck                         |

**Ejemplo — login**
```bash
curl -X POST http://localhost:4000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"usuario":"admin@corporativoalpha.com","password":"Admin123"}'
# → { "user": { "usuario": "...", "rol": "ADMINISTRADOR" }, "token": "eyJ..." }
```

---

## catalog-service (`:4001`)

### Espacios
| Método | Ruta                   | Auth          | Descripción                          |
|--------|------------------------|---------------|--------------------------------------|
| GET    | `/spaces`              | JWT           | Listar (`?tipo=`, `?status=`)        |
| GET    | `/spaces/:id`          | JWT           | Detalle                              |
| POST   | `/spaces`              | ADMINISTRADOR | Crear espacio                        |
| PUT    | `/spaces/:id`          | ADMINISTRADOR | Actualizar                           |
| DELETE | `/spaces/:id`          | ADMINISTRADOR | Eliminar                             |
| PATCH  | `/spaces/:id/status`   | JWT           | Cambiar status (uso interno booking) |
| PUT    | `/spaces/:id/reservas` | JWT           | Sincronizar reservas embebidas       |

### Recursos
| Método | Ruta             | Auth          | Descripción       |
|--------|------------------|---------------|-------------------|
| GET    | `/recursos`      | JWT           | Listar recursos   |
| GET    | `/recursos/:id`  | JWT           | Detalle           |
| POST   | `/recursos`      | ADMINISTRADOR | Crear recurso     |
| PUT    | `/recursos/:id`  | ADMINISTRADOR | Actualizar        |
| DELETE | `/recursos/:id`  | ADMINISTRADOR | Eliminar          |

**Ejemplo — listar espacios**
```bash
curl http://localhost:4001/spaces -H "Authorization: Bearer $TOKEN"
```

---

## booking-service (`:4002`)

| Método | Ruta                       | Auth | Descripción                                   |
|--------|----------------------------|------|-----------------------------------------------|
| POST   | `/reservas`                | JWT  | Crear `{ spaceId, fechaInicio, fechaFin, asistentes }` |
| GET    | `/reservas/me`             | JWT  | Mis reservas (recalcula estados)              |
| GET    | `/reservas/ocupados`       | JWT  | `?inicio&fin` → `spaceId[]` ocupados en el rango |
| GET    | `/reservas/space/:spaceId` | JWT  | Reservas activas de un espacio                |
| PATCH  | `/reservas/:id/cancel`     | JWT  | Cancelar (solo si está `programada`)          |
| POST   | `/reservas/sync`           | JWT  | Recalcular estados y sincronizar espacios     |

### Reglas de negocio (validaciones de `POST /reservas`)
| Regla | Respuesta si falla |
|-------|--------------------|
| Campos obligatorios + fechas válidas | `400` |
| `fechaInicio < fechaFin` | `400` |
| No en el pasado | `400` |
| Duración máxima 8 h | `400` |
| `asistentes ≤ capacidad` del espacio | `400` |
| El espacio debe existir | `404` |
| Sin solapamiento con otra reserva activa | `409` |

**Ejemplo — crear reserva**
```bash
curl -X POST http://localhost:4002/reservas \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"spaceId":"<id>","fechaInicio":"2026-09-01T10:00:00.000Z","fechaFin":"2026-09-01T11:00:00.000Z","asistentes":6}'
```

**Ejemplo — disponibilidad**
```bash
curl "http://localhost:4002/reservas/ocupados?inicio=2026-09-01T10:00:00.000Z&fin=2026-09-01T12:00:00.000Z" \
  -H "Authorization: Bearer $TOKEN"
# → ["<spaceId ocupado>", ...]
```
