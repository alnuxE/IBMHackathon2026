'use client';

import { useEffect, useState } from 'react';
import WalletGuard from '../../components/WalletGuard';
import { accountsApi, processorApi } from '../../services/api';
import { getCurrentUserId } from '../../utils/wallet';
import { money, dateTime, initials } from '../../utils/format';

function History() {
  const [tx, setTx] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const id = getCurrentUserId();
      const [history, list] = await Promise.all([processorApi.history(id), accountsApi.list()]);
      setTx(history);
      setUsers(list);
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

  if (loading) return <div className="loading"><span className="spinner" /> Cargando historial…</div>;

  return (
    <div className="reveal">
      <div className="page-head">
        <span className="eyebrow">Actividad</span>
        <h1>Historial de transacciones</h1>
        <p className="lead muted">Todos tus movimientos: enviados y recibidos.</p>
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      <div className="card">
        {tx.length === 0 ? (
          <div className="empty">No hay transacciones todavía.</div>
        ) : (
          <div className="list">
            {tx.map((t) => {
              const sent = t.type === 'sent';
              return (
                <div key={t.id} className="list-row">
                  <span className="avatar">{initials(nameOf(t.counterparty_id))}</span>
                  <div className="grow">
                    <b>{sent ? 'Enviado a' : 'Recibido de'} {nameOf(t.counterparty_id)}</b>
                    <div className="sub">#{t.id} · {dateTime(t.created_at)}</div>
                  </div>
                  <span className={`status status--${t.status.toLowerCase()}`}>
                    <span className="dot" />{t.status}
                  </span>
                  <span className={sent ? 'amount-neg' : 'amount-pos'} style={{ minWidth: 100, textAlign: 'right' }}>
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

export default function HistoryPage() {
  return <WalletGuard><History /></WalletGuard>;
}
