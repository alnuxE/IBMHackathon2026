'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import WalletGuard from '../../components/WalletGuard';
import { useToast } from '../../components/Toast';
import { accountsApi, processorApi } from '../../services/api';
import { getCurrentUserId } from '../../utils/wallet';
import { money, initials } from '../../utils/format';

function TransferForm() {
  const router = useRouter();
  const toast = useToast();
  const [me, setMe] = useState(null);
  const [others, setOthers] = useState([]);
  const [receiverId, setReceiverId] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const id = getCurrentUserId();
      const [account, list] = await Promise.all([accountsApi.get(id), accountsApi.list()]);
      setMe(account);
      setOthers(list.filter((u) => u.id !== id));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const onChange = () => { setReceiverId(''); setAmount(''); load(); };
    window.addEventListener('neowallet:user-changed', onChange);
    return () => window.removeEventListener('neowallet:user-changed', onChange);
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');

    const amt = Number(amount);
    if (!receiverId) return setError('Elige a quién enviar el dinero.');
    if (!Number.isFinite(amt) || amt <= 0) return setError('Ingresa un monto válido mayor a 0.');
    if (me && amt > me.balance) return setError('No tienes saldo suficiente para esa transferencia.');

    setSending(true);
    try {
      const res = await processorApi.transfer({
        sender_id: getCurrentUserId(),
        receiver_id: Number(receiverId),
        amount: amt,
        // Idempotencia: si la petición se reintenta (red/timeout), el backend no
        // crea una segunda transferencia con la misma clave.
        idempotency_key: crypto.randomUUID(),
      });
      toast(`Transferencia completada (#${res.transaction_id})`, 'success');
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
        <span className="eyebrow">Pago P2P</span>
        <h1>Transferir dinero</h1>
        <p className="lead muted">Envía saldo a otro usuario de NeoWallet, al instante y sin comisiones.</p>
      </div>

      {me && (
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <span className="avatar">{initials(me.name)}</span>
          <div className="grow">
            <div className="muted" style={{ fontSize: 12 }}>Tu saldo</div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>{money(me.balance)}</div>
          </div>
        </div>
      )}

      <form className="card" onSubmit={onSubmit}>
        {error && <div className="alert alert--error">{error}</div>}

        <div className="field">
          <label htmlFor="receiver">Enviar a</label>
          <select id="receiver" value={receiverId} onChange={(e) => setReceiverId(e.target.value)}>
            <option value="">Selecciona un usuario…</option>
            {others.map((u) => (
              <option key={u.id} value={u.id}>{u.name} — {u.email}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="amount">Monto (USD)</label>
          <input id="amount" type="number" min="0.01" step="0.01" placeholder="0.00"
                 value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>

        <button className="btn btn--lg btn--block" type="submit" disabled={sending}>
          {sending ? <><span className="spinner" style={{ width: 16, height: 16, borderColor: 'rgba(255,255,255,0.5)', borderTopColor: '#fff' }} /> Enviando…</> : 'Enviar transferencia'}
        </button>
      </form>
    </div>
  );
}

export default function TransferPage() {
  return <WalletGuard><TransferForm /></WalletGuard>;
}
