'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { getUser, getToken } from '../utils/auth';

const TABS = [
  { href: '/admin/ocupacion', label: 'Ocupación' },
  { href: '/admin/reservas', label: 'Reservas' },
  { href: '/admin/usuarios', label: 'Usuarios' },
  { href: '/admin/recursos', label: 'Recursos' },
  { href: '/admin/espacios', label: 'Espacios' },
];

export default function AdminGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const token = getToken();
    const user = getUser();
    if (!token) router.push('/login');
    else if (!user || user.rol !== 'ADMINISTRADOR') router.push('/spaces');
    else setOk(true);
  }, []);

  if (!ok) return <div className="loading"><span className="spinner" /> Verificando permisos…</div>;

  return (
    <div className="reveal">
      <div className="page-head">
        <span className="eyebrow">Administración</span>
        <h1>Panel de control</h1>
        <p className="muted">Gestiona usuarios, recursos y espacios de trabajo.</p>
      </div>

      <div className="segmented" style={{ marginBottom: 24 }}>
        {TABS.map((t) => (
          <Link key={t.href} href={t.href} className={pathname === t.href ? 'is-active' : ''}>{t.label}</Link>
        ))}
      </div>

      {children}
    </div>
  );
}
