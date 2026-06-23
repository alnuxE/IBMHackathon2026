# Casos de prueba manuales — OfficeSpace

Credenciales:
- Admin: `admin@corporativoalpha.com` / `Admin123`
- Colaborador: `carlos.mendez@corporativoalpha.com` / `User123`

Notas:
- Los endpoints requieren `Authorization: Bearer <token>` salvo `POST /auth/login`.
- Las fechas se envían en ISO-8601 (UTC), p.ej. `2027-09-01T10:00:00.000Z`.
- Capacidades del seed: ESP-001 = 12, ESP-002 = 1, ESP-003 = 20.
- Jornada de referencia para disponibilidad/horarios: 07:00–22:00.

---

## Autenticación y roles

### CP-01 · Login válido
- **Pasos:** `POST /auth/login` con admin.
- **Esperado:** `200`, body con `token` y `user.rol = ADMINISTRADOR`.

### CP-02 · Login con contraseña incorrecta
- **Pasos:** `POST /auth/login` con password errónea.
- **Esperado:** `401` `{ error: "Credenciales inválidas" }`. Sin token.

### CP-03 · Endpoint protegido sin token
- **Pasos:** `GET /spaces` sin Authorization.
- **Esperado:** `401`.

### CP-04 · Token inválido
- **Pasos:** `GET /spaces` con `Authorization: Bearer abc.def.ghi`.
- **Esperado:** `401`.

### CP-05 · Crear espacio como Colaborador
- **Pasos:** `POST /spaces` con token de colaborador.
- **Esperado:** `403` "No tienes permisos para esta acción".

### CP-06 · Crear espacio como Administrador
- **Pasos:** `POST /spaces` con datos válidos (token admin).
- **Esperado:** `201` con el espacio y su `_id`.

---

## Motor de reservas (lógica crítica)

### CP-07 · Crear reserva válida
- **Precondiciones:** ESP-001 libre en el horario.
- **Pasos:** `POST /reservas` `{spaceId, fechaInicio, fechaFin, asistentes: 6}` (1 h, futuro).
- **Esperado:** `201`, reserva con `status: programada`.

### CP-08 · No-solapamiento ("El abrazo")
- **Precondiciones:** reserva en ESP-001 de 10:00 a 12:00.
- **Pasos:** `POST /reservas` ESP-001 de 09:30 a 13:00 (envuelve la existente).
- **Esperado:** `409` "El espacio ya está reservado en ese horario".

### CP-09 · Solapamiento parcial
- **Precondiciones:** reserva 10:00–12:00.
- **Pasos:** `POST /reservas` 11:00–13:00.
- **Esperado:** `409`.

### CP-10 · Reservas consecutivas (fin exclusivo)
- **Precondiciones:** reserva 10:00–11:00.
- **Pasos:** `POST /reservas` 11:00–12:00.
- **Esperado:** `201` (no se considera solapamiento).

### CP-11 · Capacidad excedida
- **Pasos:** `POST /reservas` en ESP-002 (cap 1) con `asistentes: 5`.
- **Esperado:** `400` "El número de asistentes (5) excede la capacidad del espacio (1)".

### CP-12 · Asistentes obligatorio / inválido
- **Pasos:** `POST /reservas` sin `asistentes` (y luego con `0`).
- **Esperado:** `400` "asistentes es obligatorio" / "asistentes debe ser un número entero mayor o igual a 1".

### CP-13 · Fecha en el pasado
- **Pasos:** `POST /reservas` con `fechaInicio` anterior a ahora.
- **Esperado:** `400` "No se puede reservar en el pasado".

### CP-14 · Fin anterior al inicio
- **Pasos:** `POST /reservas` con `fechaFin < fechaInicio`.
- **Esperado:** `400` "fechaInicio debe ser anterior a fechaFin".

### CP-15 · Duración mayor a 8 horas
- **Pasos:** `POST /reservas` con duración de 9 h.
- **Esperado:** `400` "La reserva no puede exceder 8 horas".

### CP-16 · Espacio inexistente
- **Pasos:** `POST /reservas` con `spaceId` que no existe.
- **Esperado:** `404` "El espacio indicado no existe".

---

## Mis reservas / cancelación / ciclo de vida

### CP-17 · Mis reservas
- **Pasos:** `GET /reservas/me`.
- **Esperado:** `200`, solo las reservas del usuario autenticado.

### CP-18 · Cancelar reserva propia (programada)
- **Pasos:** `PATCH /reservas/:id/cancel` con el dueño.
- **Esperado:** `200`, `status: cancelada`; permanece en el histórico.

### CP-19 · Cancelar reserva de otro usuario
- **Pasos:** `PATCH /reservas/:id/cancel` con otro token.
- **Esperado:** `403`.

### CP-20 · Estados por tiempo (sync)
- **Pasos:** crear reserva con inicio/fin en distintos momentos y `POST /reservas/sync`.
- **Esperado:** futura `programada`, en curso `progreso`, pasada `finalizada`;
  las finalizadas salen del array embebido del espacio pero quedan en `reservas`.

---

## Disponibilidad y búsqueda

### CP-21 · Nivel de disponibilidad del espacio
- **Pasos:** sin reservas → `GET /spaces/:id` `status = alta`; con reservas parciales en
  la próxima jornada → `baja`; jornada 07–22 completa → `ninguna`.
- **Esperado:** el `status` refleja alta/baja/ninguna.

### CP-22 · Buscador de disponibilidad por rango
- **Precondiciones:** reserva en ESP-001 de 10:00 a 12:00.
- **Pasos:** `GET /reservas/ocupados?inicio=...T11:00&fin=...T13:00`.
- **Esperado:** `200`, el array incluye el `spaceId` de ESP-001.
  Para un rango que no solapa, NO lo incluye. Sin `inicio`/`fin` → `400`.

---

## Administración: vista y migración (Excel)

### CP-23 · Listar todas las reservas (solo Admin)
- **Pasos:** `GET /reservas` con admin / con colaborador.
- **Esperado:** admin `200` (todas); colaborador `403`.

### CP-24 · Importar reservas (migración masiva)
- **Pasos:** `POST /reservas/import` (admin) con un arreglo de reservas válidas.
- **Esperado:** `201` `{ total, importadas, rechazadas[] }` con `importadas > 0`.

### CP-25 · Importar con filas inválidas
- **Pasos:** importar incluyendo una fila con `asistentes > capacidad` y otra con
  `spaceCodigo` inexistente.
- **Esperado:** esas filas aparecen en `rechazadas` con su motivo; las válidas se importan.

### CP-26 · Importar como Colaborador
- **Pasos:** `POST /reservas/import` con token de colaborador.
- **Esperado:** `403`.

### CP-27 · Exportar (UI)
- **Pasos:** Admin → Reservas → **Exportar CSV** / **Exportar Excel**.
- **Esperado:** se descarga el archivo con las columnas
  `Codigo, Espacio, Usuario, FechaInicio, FechaFin, Asistentes, Estado` y todas las filas visibles.

---

## Documentación

### CP-28 · Swagger accesible
- **Pasos:** abrir `/api-docs` en `:4000`, `:4001`, `:4002`.
- **Esperado:** `200`, Swagger UI con los endpoints y el botón **Authorize** (Bearer).
