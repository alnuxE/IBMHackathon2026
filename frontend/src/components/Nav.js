'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { accountsApi } from '../services/api';
import { getCurrentUserId, setCurrentUserId } from '../utils/wallet';

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [currentId, setCurrentId] = useState(null);

  const sync = useCallback(() => setCurrentId(getCurrentUserId()), []);

  useEffect(() => {
    accountsApi.list().then(setUsers).catch(() => setUsers([]));
  }, [pathname]);

  useEffect(() => {
    sync();
    window.addEventListener('neowallet:user-changed', sync);
    return () => window.removeEventListener('neowallet:user-changed', sync);
  }, [sync, pathname]);

  // En la pantalla de selección de usuario no mostramos navegación
  if (pathname === '/') return null;

  const isActive = (href) => pathname === href || pathname.startsWith(href + '/');

  function onSwitch(e) {
    const id = Number(e.target.value);
    setCurrentUserId(id);
    setCurrentId(id);
    router.refresh();
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
      <Link href="/accounts" className={`nav-link ${isActive('/accounts') ? 'is-active' : ''}`}>Usuarios</Link>

      <span className="nav-spacer" />

      {users.length > 0 && currentId != null && (
        <select className="nav-select" value={currentId} onChange={onSwitch} aria-label="Cambiar de usuario">
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
      )}
    </nav>
  );
}
