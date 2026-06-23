'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { getUser, logout } from '../utils/auth';

export default function Nav() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);

  useEffect(() => { setUser(getUser()); }, [pathname]);

  function handleLogout() {
    logout();
    setUser(null);
    router.push('/login');
  }

  // En login no mostramos navegación
  if (pathname === '/login') return null;

  const isActive = (href) => pathname === href || (href !== '/spaces' && pathname.startsWith(href));

  return (
    <nav className="nav">
      <Link href="/spaces" className="brand">
        <span className="brand-mark">O</span>
        <span className="brand-text">OfficeSpace</span>
      </Link>

      {user && (
        <>
          <Link href="/spaces" className={`nav-link ${isActive('/spaces') ? 'is-active' : ''}`}>Espacios</Link>
          <Link href="/bookings" className={`nav-link ${isActive('/bookings') ? 'is-active' : ''}`}>Mis reservas</Link>
          {user.rol === 'ADMINISTRADOR' && (
            <Link href="/admin" className={`nav-link ${isActive('/admin') ? 'is-active' : ''}`}>Admin</Link>
          )}
        </>
      )}

      <span className="nav-spacer" />

      {user ? (
        <div className="nav-user">
          <span className="who">{user.usuario}</span>
          <span className="status status--libre role-pill"><span className="dot" />{user.rol === 'ADMINISTRADOR' ? 'Admin' : 'Colaborador'}</span>
          <button className="btn btn--ghost btn--sm" onClick={handleLogout}>Salir</button>
        </div>
      ) : (
        <Link href="/login" className="btn btn--sm">Iniciar sesión</Link>
      )}
    </nav>
  );
}
