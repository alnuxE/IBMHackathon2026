'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { accountsApi } from '../services/api';
import { setCurrentUserId } from '../utils/wallet';
import { money, initials } from '../utils/format';

export default function SelectUserPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    accountsApi.list()
      .then(setUsers)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  function pick(id) {
    setCurrentUserId(id);
    router.push('/wallet');
  }

  return (
    <div className="reveal" style={{ maxWidth: 720, margin: '0 auto' }}>
      <div className="page-head" style={{ textAlign: 'center' }}>
        <span className="eyebrow">NeoWallet · Pagos P2P</span>
        <h1>¿Con qué cuenta quieres entrar?</h1>
        <p className="lead muted">
          No hay registro: elige uno de los usuarios pre-cargados para usar la billetera.
        </p>
      </div>

      {error && <div className="alert alert--error">{error}</div>}
      {loading && <div className="loading"><span className="spinner" /> Cargando usuarios…</div>}

      <div className="grid">
        {users.map((u) => (
          <div key={u.id} className="card card-link" onClick={() => pick(u.id)} role="button" tabIndex={0}
               onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && pick(u.id)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span className="avatar avatar--lg">{initials(u.name)}</span>
              <div style={{ minWidth: 0 }}>
                <h3 style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.name}</h3>
                <div className="sub muted" style={{ fontSize: 13 }}>{u.email}</div>
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <div className="muted" style={{ fontSize: 12 }}>Saldo</div>
              <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>{money(u.balance)}</div>
            </div>
            <span className="go">Entrar como este usuario →</span>
          </div>
        ))}
      </div>
    </div>
  );
}
