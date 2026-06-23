'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUserId } from '../utils/wallet';
import PageLoader from './PageLoader';

// Asegura que haya un usuario activo seleccionado. Si no, manda a la
// pantalla de selección ("/"). Evita parpadeos renderizando un loader.
export default function WalletGuard({ children }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (getCurrentUserId() == null) {
      router.replace('/');
    } else {
      setReady(true);
    }
  }, [router]);

  if (!ready) return <PageLoader />;
  return children;
}
