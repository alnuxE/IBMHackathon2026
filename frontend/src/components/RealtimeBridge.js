'use client';

import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { getToken } from '../utils/wallet';
import { useToast } from './Toast';
import { money } from '../utils/format';

// Resuelve la URL del processor (WebSocket) igual que api.js: deriva del host del
// navegador para que funcione también al entrar por la IP de la LAN.
function processorUrl() {
  const env = process.env.NEXT_PUBLIC_PROCESSOR_URL;
  if (env && !/localhost|127\.0\.0\.1/.test(env)) return env;
  if (typeof window !== 'undefined') return `${window.location.protocol}//${window.location.hostname}:3001`;
  return 'http://localhost:3001';
}

// Mantiene una conexión WebSocket autenticada mientras haya sesión. Al recibir
// dinero muestra un aviso y refresca saldos/historial en vivo (sin recargar).
export default function RealtimeBridge() {
  const toast = useToast();
  const sockRef = useRef(null);
  const tokenRef = useRef(null);

  useEffect(() => {
    function connect() {
      const token = getToken();
      // Si el token no cambió y ya hay socket, no reconectar (evita parpadeos).
      if (token === tokenRef.current && sockRef.current) return;
      tokenRef.current = token;

      if (sockRef.current) { sockRef.current.disconnect(); sockRef.current = null; }
      if (!token) return; // sin sesión: no conectar

      const socket = io(processorUrl(), {
        auth: { token },
        transports: ['websocket', 'polling'],
      });

      socket.on('transfer:incoming', (p) => {
        toast(`Recibiste ${money(p.amount)} 💸`, 'success');
        // Reutiliza el plumbing existente: las páginas recargan con este evento.
        window.dispatchEvent(new Event('neowallet:user-changed'));
      });

      sockRef.current = socket;
    }

    connect();
    // Reconecta al iniciar/cerrar sesión (mismo evento que dispara setSession/clearSession).
    window.addEventListener('neowallet:user-changed', connect);
    return () => {
      window.removeEventListener('neowallet:user-changed', connect);
      if (sockRef.current) { sockRef.current.disconnect(); sockRef.current = null; }
    };
  }, [toast]);

  return null;
}
