# booking-service

Microservicio B — motor de **reservas**.

- Puerto: `4002`
- Base de datos: colección `reservas` en MongoDB (`officespace`)
- **Depende de catalog-service vía HTTP** (`CATALOG_SERVICE_URL`): valida el
  espacio y actualiza su `status`.

## Endpoints — `/reservas`

| Método | Ruta                       | Auth | Descripción                                  |
|--------|----------------------------|------|----------------------------------------------|
| GET    | `/health`                  | —    | Healthcheck                                  |
| GET    | `/reservas/space/:spaceId` | —    | Reservas confirmadas de un espacio           |
| POST   | `/reservas`                | JWT  | Crear `{ spaceId, fechaInicio, fechaFin, asistentes }` |
| GET    | `/reservas/me`             | JWT  | Mis reservas (recalcula estados)             |
| PATCH  | `/reservas/:id/cancel`     | JWT  | Cancelar (solo si está `programada`)         |
| POST   | `/reservas/sync`           | JWT  | Recalcula estados y sincroniza espacios      |

Modelo `Reserva`: `spaceId, spaceCodigo, spaceNombre, fechaInicio, fechaFin,
userId, usuario, status (programada|progreso|finalizada|cancelada)`.

## Lógica clave

- Valida el espacio en catalog-service (`GET /spaces/:id`) antes de reservar.
- Comprueba que no haya **solape** con otra reserva activa del mismo espacio.
- **Validación de capacidad**: los `asistentes` no pueden exceder la `capacidad`
  del espacio (se consulta vía HTTP al catálogo) → 400 si la excede.
- **Ciclo de vida** (`sync`): recalcula por tiempo `programada → progreso →
  finalizada`. Las reservas activas (programada/progreso) se embeben en el espacio
  vía `PUT /spaces/:id/reservas`; al finalizar salen del espacio pero **quedan en
  `reservas`**. El `status` del espacio lo deriva catalog-service del array embebido.
- Validaciones (`/src/validators`): campos obligatorios, fechas válidas,
  `fechaInicio < fechaFin`, no en el pasado, máx. 8 h, asistentes ≥ 1.

## Documentación API

Swagger UI disponible en **`http://localhost:4002/api-docs`**.

## Ejecutar en local

```bash
npm install && cp .env.example .env && npm run dev
```
