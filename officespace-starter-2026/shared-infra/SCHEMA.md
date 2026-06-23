# Esquema de datos (MongoDB — base de datos `officespace`)

Aunque es NoSQL, los servicios comparten **una sola base de datos** con cuatro
colecciones. A continuación el esquema lógico de documentos y sus relaciones.

## Colecciones

| Colección  | Dueño            | Contenido                                  |
|------------|------------------|--------------------------------------------|
| `users`    | auth-service     | Usuarios y rol (login)                     |
| `recursos` | catalog-service  | Catálogo **dinámico** de recursos          |
| `spaces`   | catalog-service  | Espacios de trabajo (referencian recursos) |
| `reservas` | booking-service  | Reservas de espacios                        |

## Diagrama de relaciones (lógico)

```
┌─────────────────────┐        ┌──────────────────────┐
│       users         │        │       recursos        │
├─────────────────────┤        ├──────────────────────┤
│ _id        ObjectId │        │ _id        ObjectId  │
│ usuario    string ◄─┼─unique │ codigo     string ◄──┼─unique
│ passwordHash string │        │ nombre     string    │
│ rol        enum     │        │ categoria  string    │
│ (ADMIN/COLABORADOR) │        │ descripcion string   │
│ createdAt  date     │        │ activo     bool      │
└──────────┬──────────┘        └──────────┬───────────┘
           │                              │ (referenciado en spaces.recursos[])
           │                              ▼
           │                   ┌──────────────────────┐
           │                   │        spaces         │
           │                   ├──────────────────────┤
           │                   │ _id        ObjectId  │
           │                   │ codigo     string ◄──┼─unique (ID legible)
           │                   │ nombre     string    │
           │                   │ tipo       enum      │ (sala_juntas | escritorio_individual)
           │                   │ capacidad  number    │
           │                   │ recursos   [ {        │
           │                   │   recursoId ObjectId ─┼─► recursos._id
           │                   │   codigo, nombre,     │
           │                   │   cantidad } ]        │
           │                   │ ubicacion  {          │
           │                   │   edificio string,    │
           │                   │   piso     number,    │
           │                   │   numEscritorio string│
           │                   │ }                     │
           │                   │ status     enum       │ (alta | baja | ninguna) disponibilidad
           │                   │ reservasProgramadas[  │ ← reservas ACTIVAS embebidas
           │                   │   { reservaId ────────┼─► reservas._id
           │                   │     usuario, fechaIni,│
           │                   │     fechaFin, status }]│ (programada | progreso)
           │                   └──────────┬───────────┘
           │   userId                     │  spaceId (validado vía HTTP)
           │        ┌─────────────────────┴────┐
           └───────►│         reservas          │
                    ├──────────────────────────┤
                    │ _id         ObjectId      │
                    │ spaceId     string ───────┼─► spaces._id
                    │ spaceCodigo string        │
                    │ spaceNombre string        │
                    │ fechaInicio date          │
                    │ fechaFin    date          │
                    │ asistentes  number        │ (≤ spaces.capacidad)
                    │ userId      string ───────┼─► users._id
                    │ usuario     string        │
                    │ status      enum          │ (programada|progreso|finalizada|cancelada)
                    │ createdAt   date          │
                    └──────────────────────────┘
```

## Notas de diseño

- **Recursos dinámicos**: `recursos` es un catálogo editable por el ADMINISTRADOR
  (proyector, monitor, mouse, pantalla, etc.). Cada espacio referencia los recursos
  que tiene en `spaces.recursos[]`, denormalizando `codigo`/`nombre` para mostrarlos
  sin otra consulta, más una `cantidad`.
- **Ubicación** separada en sub-documento (`edificio`, `piso`, `numEscritorio`).
  `numEscritorio` solo aplica a `escritorio_individual` (null en salas).
- **Reservas embebidas en el espacio** (`spaces.reservasProgramadas[]`): cada
  espacio guarda embebidas solo sus reservas **activas** (`programada`/`progreso`).
  Cuando una reserva termina (`finalizada`) o se cancela, **sale del array** del
  espacio, pero su registro **permanece en la colección `reservas`** (histórico).
- **Ciclo de vida de la reserva**: `programada → progreso → finalizada`
  (`cancelada` si se anula). booking-service recalcula los estados por tiempo en la
  rutina `sync` (al crear/cancelar/listar y vía `POST /reservas/sync`).
- **status del espacio = nivel de disponibilidad** (`alta`/`baja`/`ninguna`), lo
  **deriva** catalog-service según las horas reservadas hoy sobre la jornada 07:00–22:00:
  `alta` (día libre), `baja` (queda hueco), `ninguna` (jornada completa).
  booking-service le envía el array por HTTP (`PUT /spaces/:id/reservas`).
- **Relaciones por referencia lógica**, no por `$lookup` entre servicios: cada
  servicio es dueño de su colección. `booking-service` valida el espacio llamando
  a `catalog-service` por **HTTP** (`GET /spaces/:id`).

## Índices (en `init-mongo.js`)

- `users.usuario` (único)
- `recursos.codigo` (único)
- `spaces.codigo` (único), `spaces.tipo`, `spaces.status`
- `reservas.{spaceId,fechaInicio,fechaFin}`, `reservas.userId`
