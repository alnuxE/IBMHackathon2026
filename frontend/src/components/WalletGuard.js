'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '../utils/wallet';
import PageLoader from './PageLoader';

// Protege las rutas privadas: si no hay sesión (token), manda al login ("/").
// Evita parpadeos renderizando un loader hasta verificar la sesión.
export default function WalletGuard({ children }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/');
    } else {
      setReady(true);
    }
  }, [router]);

  if (!ready) return <PageLoader />;
  return children;
}
