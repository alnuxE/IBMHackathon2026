'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import WalletGuard from '../../components/WalletGuard';
import { useToast } from '../../components/Toast';
import { accountsApi } from '../../services/api';
import { getCurrentUserId } from '../../utils/wallet';
import { money, initials } from '../../utils/format';

const QUICK = [50, 100, 250, 500];

function RechargeForm() {
  const router = useRouter();
  const toast = useToast();
  const [me, setMe] = useState(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('card');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setMe(await accountsApi.get(getCurrentUserId()));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const onChange = () => { setAmount(''); load(); };
    window.addEventListener('neowallet:user-changed', onChange);
    return () => window.removeEventListener('neowallet:user-changed', onChange);
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) return setError('Ingresa un monto válido mayor a 0.');

    setSending(true);
    try {
      const res = await accountsApi.recharge({
        user_id: getCurrentUserId(),
        amount: amt,
        payment_method: method,
      });
      toast(`Recarga exitosa. Nuevo saldo: ${money(res.new_balance)}`, 'success');
      router.push('/wallet');
    } catch (e) {
      setError(e.message);
      toast(e.message, 'error');
    } finally {
      setSending(false);
    }
  }

  if (loading) return <div className="loading"><span className="spinner" /> Cargando…</div>;

  return (
    <div className="reveal" style={{ maxWidth: 560, margin: '0 auto' }}>
      <div className="page-head">
        <span className="eyebrow">Fondos</span>
        <h1>Recargar saldo</h1>
        <p className="lead muted">Agrega fondos a tu billetera (recarga simulada, sin procesador real).</p>
      </div>

      {me && (
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <span className="avatar">{initials(me.name)}</span>
          <div className="grow">
            <div className="muted" style={{ fontSize: 12 }}>Saldo actual</div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>{money(me.balance)}</div>
          </div>
        </div>
      )}

      <form className="card" onSubmit={onSubmit}>
        {error && <div className="alert alert--error">{error}</div>}

        <div className="field">
          <label>Montos rápidos</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {QUICK.map((q) => (
              <button type="button" key={q} className="btn btn--ghost btn--sm" onClick={() => setAmount(String(q))}>
                +{money(q)}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label htmlFor="amount">Monto (USD)</label>
          <input id="amount" type="number" min="0.01" step="0.01" placeholder="0.00"
                 value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>

        <div className="field">
          <label htmlFor="method">Método de pago (simulado)</label>
          <select id="method" value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="card">Tarjeta de crédito/débito</option>
            <option value="bank_transfer">Transferencia bancaria</option>
            <option value="cash">Efectivo</option>
          </select>
        </div>

        <button className="btn btn--lg btn--block" type="submit" disabled={sending}>
          {sending ? <><span className="spinner" style={{ width: 16, height: 16, borderColor: 'rgba(255,255,255,0.5)', borderTopColor: '#fff' }} /> Procesando…</> : 'Recargar saldo'}
        </button>
      </form>
    </div>
  );
}

export default function RechargePage() {
  return <WalletGuard><RechargeForm /></WalletGuard>;
}
