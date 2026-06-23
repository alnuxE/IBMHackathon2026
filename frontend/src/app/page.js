'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '../services/api';
import { setSession, isAuthenticated } from '../utils/wallet';

// Credenciales de demo (usuarios semilla). Todos comparten la misma contraseña
// por defecto (SEED_PASSWORD en el backend).
const DEMO_USERS = [
  { name: 'Usuario A (Rico)', email: 'usuario.a@neowallet.com' },
  { name: 'Usuario B (Pobre)', email: 'usuario.b@neowallet.com' },
  { name: 'Usuario C (Nuevo)', email: 'usuario.c@neowallet.com' },
];
const DEMO_PASSWORD = 'neowallet123';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Si ya hay sesión, ir directo a la billetera
  useEffect(() => {
    if (isAuthenticated()) router.replace('/wallet');
  }, [router]);

  function quickFill(user) {
    setEmail(user.email);
    setPassword(DEMO_PASSWORD);
    setError('');
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    if (!email || !password) return setError('Ingresa tu email y contraseña.');

    setLoading(true);
    try {
      const { token, user } = await authApi.login({ email, password });
      setSession(token, user);
      router.push('/wallet');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="reveal" style={{ maxWidth: 460, margin: '0 auto' }}>
      <div className="page-head" style={{ textAlign: 'center' }}>
        <span className="eyebrow">NeoWallet · Pagos P2P</span>
        <h1>Inicia sesión</h1>
        <p className="lead muted">Accede a tu billetera digital para transferir y recargar saldo.</p>
      </div>

      <form className="card" onSubmit={onSubmit}>
        {error && <div className="alert alert--error">{error}</div>}

        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" autoComplete="username" placeholder="tu@correo.com"
                 value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div className="field">
          <label htmlFor="password">Contraseña</label>
          <input id="password" type="password" autoComplete="current-password" placeholder="••••••••"
                 value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        <button className="btn btn--lg btn--block" type="submit" disabled={loading}>
          {loading
            ? <><span className="spinner" style={{ width: 16, height: 16, borderColor: 'rgba(255,255,255,0.5)', borderTopColor: '#fff' }} /> Entrando…</>
            : 'Entrar'}
        </button>
      </form>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="muted" style={{ fontSize: 12, marginBottom: 10 }}>
          Cuentas de demo (contraseña: <b>{DEMO_PASSWORD}</b>) — clic para autocompletar:
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {DEMO_USERS.map((u) => (
            <button type="button" key={u.email} className="btn btn--ghost btn--sm"
                    style={{ justifyContent: 'flex-start' }} onClick={() => quickFill(u)}>
              {u.name} — {u.email}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
