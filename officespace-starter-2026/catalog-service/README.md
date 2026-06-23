# catalog-service

Microservicio A — gestión de **espacios** y **recursos**.

- Puerto: `4001`
- Colecciones: `spaces` y `recursos` en MongoDB (`officespace`)

## Espacios — `/spaces`

| Método | Ruta                  | Auth          | Descripción                          |
|--------|-----------------------|---------------|--------------------------------------|
| GET    | `/spaces`             | —             | Lista (`?tipo=`, `?status=`)         |
| GET    | `/spaces/:id`         | —             | Detalle                              |
| PATCH  | `/spaces/:id/status`  | JWT           | Cambia status (lo usa booking-service)|
| POST   | `/spaces`             | ADMINISTRADOR | Crear espacio                        |
| PUT    | `/spaces/:id`         | ADMINISTRADOR | Actualizar                           |
| DELETE | `/spaces/:id`         | ADMINISTRADOR | Eliminar                             |

Modelo `Space`:
`codigo, nombre, tipo (sala_juntas|escritorio_individual), capacidad,
recursos[] (referencia al catálogo), ubicacion{edificio,piso,numEscritorio},
status (alta|baja|ninguna = nivel de disponibilidad, derivado)`.

## Recursos (catálogo dinámico) — `/recursos`

| Método | Ruta            | Auth          | Descripción                   |
|--------|-----------------|---------------|-------------------------------|
| GET    | `/recursos`     | —             | Lista (`?activo=true`, `?categoria=`) |
| GET    | `/recursos/:id` | —             | Detalle                       |
| POST   | `/recursos`     | ADMINISTRADOR | Crear recurso                 |
| PUT    | `/recursos/:id` | ADMINISTRADOR | Actualizar                    |
| DELETE | `/recursos/:id` | ADMINISTRADOR | Eliminar                      |

Modelo `Recurso`: `codigo, nombre, categoria, descripcion, activo`.

## Ejecutar en local

```bash
npm install && cp .env.example .env && npm run dev
```
