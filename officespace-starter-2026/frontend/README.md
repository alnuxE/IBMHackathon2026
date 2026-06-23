# frontend

Aplicación web en **Next.js 14 (App Router) + React**.

- Puerto: `3000`

## Las 4 pantallas mínimas

1. `/login` — Login y registro (obtiene el JWT del auth-service)
2. `/spaces` — Catálogo de espacios (consume catalog-service)
3. `/spaces/[id]` — Detalle del espacio + formulario de reserva (consume booking-service)
4. `/bookings` — Mis reservas (listar y cancelar)

## Comunicación con los microservicios

Las URLs base se inyectan por `NEXT_PUBLIC_*` (ver `.env.example`). El navegador
llama directamente a cada servicio por su puerto publicado.

## Ejecutar en local

```bash
npm install
cp .env.example .env
npm run dev
```
