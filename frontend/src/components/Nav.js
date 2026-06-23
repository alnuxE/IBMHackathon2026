'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, clearSession } from '../utils/wallet';

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);

  const sync = useCallback(() => setUser(getCurrentUser()), []);

  useEffect(() => {
    sync();
    window.addEventListener('neowallet:user-changed', sync);
    return () => window.removeEventListener('neowallet:user-changed', sync);
  }, [sync, pathname]);

  // En la pantalla de login no mostramos navegación
  if (pathname === '/') return null;

  const isActive = (href) => pathname === href || pathname.startsWith(href + '/');

  function onLogout() {
    clearSession();
    router.push('/');
  }

  return (
    <nav className="nav">
      <Link href="/wallet" className="brand">
        <span className="brand-mark">N</span>
        <span className="brand-text">NeoWallet</span>
      </Link>

      <Link href="/wallet" className={`nav-link ${isActive('/wallet') ? 'is-active' : ''}`}>Inicio</Link>
      <Link href="/transfer" className={`nav-link ${isActive('/transfer') ? 'is-active' : ''}`}>Transferir</Link>
      <Link href="/recharge" className={`nav-link ${isActive('/recharge') ? 'is-active' : ''}`}>Recargar</Link>
      <Link href="/history" className={`nav-link ${isActive('/history') ? 'is-active' : ''}`}>Historial</Link>
      <Link href="/statements" className={`nav-link ${isActive('/statements') ? 'is-active' : ''}`}>Estados</Link>
      <Link href="/accounts" className={`nav-link ${isActive('/accounts') ? 'is-active' : ''}`}>Usuarios</Link>

      <span className="nav-spacer" />

      {user && (
        <>
          <span className="nav-user muted" style={{ fontSize: 13 }}>{user.name}</span>
          <button type="button" className="btn btn--ghost btn--sm" onClick={onLogout}>
            Cerrar sesión
          </button>
        </>
      )}
    </nav>
  );
}
