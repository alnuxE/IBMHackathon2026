'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import WalletGuard from '../../components/WalletGuard';
import { accountsApi, processorApi } from '../../services/api';
import { getCurrentUserId } from '../../utils/wallet';
import { money, dateTime, initials } from '../../utils/format';

function Dashboard() {
  const [me, setMe] = useState(null);
  const [users, setUsers] = useState([]);
  const [tx, setTx] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const id = getCurrentUserId();
      const [account, list, history] = await Promise.all([
        accountsApi.get(id),
        accountsApi.list(),
        processorApi.history(id),
      ]);
      setMe(account);
      setUsers(list);
      setTx(history.slice(0, 5));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const onChange = () => load();
    window.addEventListener('neowallet:user-changed', onChange);
    return () => window.removeEventListener('neowallet:user-changed', onChange);
  }, []);

  const nameOf = (id) => users.find((u) => u.id === id)?.name || `Usuario #${id}`;

  if (loading) return <div className="loading"><span className="spinner" /> Cargando tu billetera…</div>;
  if (error) return <div className="alert alert--error">{error}</div>;
  if (!me) return null;

  return (
    <div className="reveal">
      <div className="balance-hero">
        <div className="who">Hola, {me.name}</div>
        <div className="amount">{money(me.balance)}</div>
        <div className="sub">Saldo disponible · {me.email}</div>
        <div className="actions">
          <Link href="/transfer" className="btn btn--on-grad">↗ Transferir</Link>
          <Link href="/recharge" className="btn btn--on-grad">+ Recargar</Link>
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <div className="row-between" style={{ marginBottom: 6 }}>
          <h2>Movimientos recientes</h2>
          <Link href="/history" className="nav-link">Ver todo →</Link>
        </div>

        {tx.length === 0 ? (
          <div className="empty">Aún no tienes movimientos. ¡Haz tu primera transferencia o recarga!</div>
        ) : (
          <div className="list">
            {tx.map((t) => {
              const sent = t.type === 'sent';
              return (
                <div key={t.id} className="list-row">
                  <span className="avatar">{initials(nameOf(t.counterparty_id))}</span>
                  <div className="grow">
                    <b>{sent ? 'Enviado a' : 'Recibido de'} {nameOf(t.counterparty_id)}</b>
                    <div className="sub">{dateTime(t.created_at)}</div>
                  </div>
                  <span className={`status status--${t.status.toLowerCase()}`}>
                    <span className="dot" />{t.status}
                  </span>
                  <span className={sent ? 'amount-neg' : 'amount-pos'} style={{ minWidth: 90, textAlign: 'right' }}>
                    {sent ? '−' : '+'}{money(t.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function WalletPage() {
  return <WalletGuard><Dashboard /></WalletGuard>;
}
