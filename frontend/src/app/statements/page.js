'use client';

import { useEffect, useState } from 'react';
import WalletGuard from '../../components/WalletGuard';
import { useToast } from '../../components/Toast';
import { processorApi, downloadStatementPdf } from '../../services/api';
import { getCurrentUserId } from '../../utils/wallet';
import { money, dateTime } from '../../utils/format';

function Statements() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  async function load() {
    setLoading(true);
    setError('');
    try {
      setData(await processorApi.statement(getCurrentUserId()));
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

  async function onDownload() {
    setDownloading(true);
    try {
      const id = getCurrentUserId();
      const blob = await downloadStatementPdf(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `estado-cuenta-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast('Estado de cuenta descargado (PDF)', 'success');
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setDownloading(false);
    }
  }

  if (loading) return <div className="loading"><span className="spinner" /> Cargando estado de cuenta…</div>;
  if (error) return <div className="alert alert--error">{error}</div>;
  if (!data) return null;

  return (
    <div className="reveal">
      <div className="page-head">
        <span className="eyebrow">Facturación</span>
        <h1>Estado de cuenta</h1>
        <p className="lead muted">Resumen de tus movimientos liquidados. Descárgalo en PDF como comprobante.</p>
      </div>

      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', marginBottom: 16 }}>
        <div>
          <div className="muted" style={{ fontSize: 12 }}>Titular</div>
          <b>{data.user.name}</b>
          <div className="muted" style={{ fontSize: 12 }}>Saldo actual: {money(data.current_balance)}</div>
        </div>
        <button className="btn" onClick={onDownload} disabled={downloading}>
          {downloading
            ? <><span className="spinner" style={{ width: 16, height: 16, borderColor: 'rgba(255,255,255,0.5)', borderTopColor: '#fff' }} /> Generando…</>
            : '⬇ Descargar PDF'}
        </button>
      </div>

      <div className="grid" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="muted" style={{ fontSize: 12 }}>Total recibido</div>
          <div className="amount-pos" style={{ fontSize: 22, fontWeight: 700 }}>+{money(data.summary.total_received)}</div>
        </div>
        <div className="card">
          <div className="muted" style={{ fontSize: 12 }}>Total enviado</div>
          <div className="amount-neg" style={{ fontSize: 22, fontWeight: 700 }}>−{money(data.summary.total_sent)}</div>
        </div>
        <div className="card">
          <div className="muted" style={{ fontSize: 12 }}>Movimientos</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{data.summary.count}</div>
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: 6 }}>Movimientos liquidados</h2>
        {data.movements.length === 0 ? (
          <div className="empty">Aún no tienes movimientos liquidados.</div>
        ) : (
          <div className="list">
            {data.movements.map((m) => {
              const sent = m.type === 'sent';
              return (
                <div key={m.id} className="list-row">
                  <div className="grow">
                    <b>{sent ? 'Enviado a' : 'Recibido de'} Usuario #{m.counterparty_id}</b>
                    <div className="sub">#{m.id} · {dateTime(m.created_at)}</div>
                  </div>
                  <span className={sent ? 'amount-neg' : 'amount-pos'} style={{ minWidth: 100, textAlign: 'right' }}>
                    {sent ? '−' : '+'}{money(m.amount)}
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

export default function StatementsPage() {
  return <WalletGuard><Statements /></WalletGuard>;
}
