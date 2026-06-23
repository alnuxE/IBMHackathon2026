'use client';

import { useEffect, useState } from 'react';
import WalletGuard from '../../components/WalletGuard';
import { accountsApi } from '../../services/api';
import { getCurrentUserId } from '../../utils/wallet';
import { initials } from '../../utils/format';

function Accounts() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const currentId = getCurrentUserId();

  useEffect(() => {
    accountsApi.list()
      .then(setUsers)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><span className="spinner" /> Cargando usuarios…</div>;

  return (
    <div className="reveal">
      <div className="page-head">
        <span className="eyebrow">Cuentas</span>
        <h1>Usuarios de NeoWallet</h1>
        <p className="lead muted">
          Directorio de usuarios de la plataforma. Por seguridad, el saldo de cada
          cuenta solo es visible para su propietario.
        </p>
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      <div className="grid">
        {users.map((u) => (
          <div key={u.id} className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="avatar">{initials(u.name)}</span>
              <div className="grow" style={{ minWidth: 0 }}>
                <b style={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.name}</b>
                <div className="sub muted" style={{ fontSize: 12 }}>{u.email}</div>
              </div>
              {u.id === currentId && (
                <span className="status status--completed"><span className="dot" />Tú</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AccountsPage() {
  return <WalletGuard><Accounts /></WalletGuard>;
}
