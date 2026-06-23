'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { reservaApi } from '../../services/api';
import { useToast } from '../../components/Toast';
import { getToken } from '../../utils/auth';

const STATUS_LABELS = {
  programada: 'Programada',
  progreso: 'En curso',
  finalizada: 'Finalizada',
  cancelada: 'Cancelada',
};

export default function BookingsPage() {
  const router = useRouter();
  const [reservas, setReservas] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  async function load() {
    const token = getToken();
    if (!token) { router.push('/login'); return; }
    setReservas(await reservaApi.mine(token));
  }

  useEffect(() => {
    load().catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, []);

  async function cancelar(id) {
    setError('');
    try {
      await reservaApi.cancel(id, getToken());
      await load();
      toast('Reserva cancelada');
    } catch (err) {
      setError(err.message);
      toast(err.message, 'error');
    }
  }

  if (loading) return <div className="loading"><span className="spinner" /> Cargando…</div>;

  return (
    <>
      <div className="page-head">
        <span className="eyebrow">Tu actividad</span>
        <h1>Mis reservas</h1>
        <p className="muted">Tus reservas programadas, en curso y su historial.</p>
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      {reservas.length === 0 ? (
        <div className="empty">
          Todavía no tienes reservas.<br />
          <Link href="/spaces" className="btn btn--sm" style={{ marginTop: 16 }}>Explorar espacios</Link>
        </div>
      ) : (
        <div className="grid">
          {reservas.map((r, i) => (
            <div className="card reveal" key={r._id} style={{ animationDelay: `${i * 50}ms` }}>
              <div className="row-between" style={{ marginBottom: 8 }}>
                <span className="eyebrow">{r.spaceCodigo}</span>
                <span className={`status status--${r.status}`}><span className="dot" />{STATUS_LABELS[r.status] || r.status}</span>
              </div>
              <h3 style={{ marginBottom: 8 }}>{r.spaceNombre || 'Espacio'}</h3>
              <p className="muted" style={{ fontSize: 13.5, margin: 0 }}>
                {new Date(r.fechaInicio).toLocaleString()}<br />→ {new Date(r.fechaFin).toLocaleString()}
                {r.asistentes ? <><br />{r.asistentes} {r.asistentes === 1 ? 'asistente' : 'asistentes'}</> : null}
              </p>
              {r.status === 'programada' && (
                <button className="btn btn--danger btn--sm" onClick={() => cancelar(r._id)} style={{ marginTop: 16, alignSelf: 'flex-start' }}>
                  Cancelar reserva
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
