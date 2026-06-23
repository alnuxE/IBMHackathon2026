# frontend

Interfaz web de NeoWallet (**Next.js 14** / React 18). **Puerto:** 3002.

Consume los microservicios por REST y recibe notificaciones en tiempo real por
WebSocket. Mismo lenguaje visual que el escenario 1.

## Pantallas

| Ruta | Descripción |
|------|-------------|
| `/` | Login (email + contraseña). Las demás rutas exigen sesión |
| `/wallet` | Dashboard: saldo + movimientos recientes |
| `/transfer` | Transferencia P2P a otro usuario |
| `/recharge` | Recarga de saldo (simulada) |
| `/history` | Historial de transacciones |
| `/accounts` | Directorio de usuarios |

## Comunicación con los microservicios

- `src/services/api.js` — clientes HTTP. Adjunta el JWT en `Authorization` y, ante
  un `401`, cierra sesión. **Resuelve la URL del backend del host del navegador**,
  así funciona también al entrar por la IP de la LAN.
- `src/components/RealtimeBridge.js` — conexión WebSocket (Socket.IO) autenticada;
  muestra un aviso y refresca saldos cuando llega dinero.
- `src/utils/wallet.js` — sesión (token + usuario) en `localStorage`.
- `src/components/WalletGuard.js` — protege las rutas privadas.

## Variables de entorno (build time)

| Variable | Por defecto | Descripción |
|----------|-------------|-------------|
| `NEXT_PUBLIC_ACCOUNTS_URL` | http://localhost:3000 | URL del accounts-service (si no, se deriva del host) |
| `NEXT_PUBLIC_PROCESSOR_URL` | http://localhost:3001 | URL del processor-service |

## Ejecutar en local

```bash
npm install
npm run dev      # http://localhost:3000 (dev) — en Docker se publica en :3002
```
