# auth-service

Microservicio de autenticación. Valida credenciales y emite tokens **JWT**.
No tiene registro: los usuarios se cargan desde el **seeder** (`shared-infra/init-mongo.js`).

- Puerto: `4000`
- Base de datos: colección `users` en MongoDB (`officespace`)

## Roles

Solo existen dos (ver `src/constants/roles.js`):

- `ADMINISTRADOR` — gestiona espacios (crear/editar/borrar en catalog-service)
- `COLABORADOR` — ve el catálogo y crea reservas

El rol viaja dentro del JWT (`rol`) y se valida con el middleware `requireRole`.

## Endpoints

| Método | Ruta             | Descripción                     | Body                       |
|--------|------------------|---------------------------------|----------------------------|
| GET    | `/health`        | Healthcheck                     | —                          |
| POST   | `/auth/login`    | Inicia sesión y devuelve token  | `{ usuario, password }`    |

Respuesta de login:

```json
{ "user": { "_id": "...", "usuario": "...", "rol": "ADMINISTRADOR" }, "token": "<JWT>" }
```

Payload del JWT: `{ sub, usuario, rol }`. Se envía como `Authorization: Bearer <JWT>`.

## Usuarios precargados (seeder)

| usuario                                | password   | rol           |
|----------------------------------------|------------|---------------|
| admin@corporativoalpha.com             | Admin123   | ADMINISTRADOR |
| carlos.mendez@corporativoalpha.com     | User123    | COLABORADOR   |
| ana.torres@corporativoalpha.com        | User123    | COLABORADOR   |

## Ejecutar en local (sin Docker)

```bash
npm install && cp .env.example .env && npm run dev
```
