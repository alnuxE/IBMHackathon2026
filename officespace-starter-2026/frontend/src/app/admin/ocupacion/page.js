'use client';

import { useEffect, useMemo, useState } from 'react';
import AdminGuard from '../../../components/AdminGuard';
import { catalogApi, reservaApi } from '../../../services/api';
import { getToken } from '../../../utils/auth';

const DAY_MS = 86400000;
const STATUS_LABELS = { alta: 'Disp. alta', baja: 'Disp. baja', ninguna: 'Sin disp.' };
function fmtHora(d) { return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }

function OcupacionDashboard() {
  const [spaces, setSpaces] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    const token = getToken();
    // Recalcula estados (programada/progreso/finalizada) antes de leer
    try { await reservaApi.sync(token); } catch (_) { /* no crítico */ }
    setSpaces(await catalogApi.listSpaces(token));
  }

  useEffect(() => {
    load().catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  const hoy = useMemo(() => {
    const inicio = new Date(); inicio.setHours(0, 0, 0, 0);
    const fin = new Date(inicio.getTime() + DAY_MS);
    return { inicio, fin };
  }, []);

  // Reservas de hoy por espacio (desde el array embebido reservasProgramadas)
  const conReservasHoy = useMemo(() => {
    return spaces
      .map((s) => {
        const reservas = (s.reservasProgramadas || [])
          .filter((r) => new Date(r.fechaInicio) < hoy.fin && new Date(r.fechaFin) > hoy.inicio)
          .sort((a, b) => new Date(a.fechaInicio) - new Date(b.fechaInicio));
        return { ...s, reservasHoy: reservas };
      })
      .filter((s) => s.reservasHoy.length > 0);
  }, [spaces, hoy]);

  const stats = useMemo(() => {
    const total = spaces.length;
    const alta = spaces.filter((s) => s.status === 'alta').length;
    const baja = spaces.filter((s) => s.status === 'baja').length;
    const ninguna = spaces.filter((s) => s.status === 'ninguna').length;
    const reservasHoy = conReservasHoy.reduce((acc, s) => acc + s.reservasHoy.length, 0);
    // % de espacios con disponibilidad reducida (baja o nula)
    const pct = total ? Math.round(((baja + ninguna) / total) * 100) : 0;
    return { total, alta, baja, ninguna, reservasHoy, pct };
  }, [spaces, conReservasHoy]);

  if (loading) return <div className="loading"><span className="spinner" /> Cargando ocupación…</div>;
  if (error) return <div className="alert alert--error">{error}</div>;

  return (
    <>
      <div className="stats">
        <div className="stat"><div className="n">{stats.total}</div><div className="l">Espacios totales</div></div>
        <div className="stat"><div className="n">{stats.alta}</div><div className="l"><span className="dot" style={{ background: 'var(--ok)' }} />Disponibilidad alta</div></div>
        <div className="stat"><div className="n">{stats.baja}</div><div className="l"><span className="dot" style={{ background: 'var(--warn)' }} />Disponibilidad baja</div></div>
        <div className="stat"><div className="n">{stats.ninguna}</div><div className="l"><span className="dot" style={{ background: 'var(--danger)' }} />Sin disponibilidad</div></div>
        <div className="stat"><div className="n">{stats.reservasHoy}</div><div className="l">Reservas hoy</div></div>
      </div>

      <div className="card">
        <div className="row-between" style={{ marginBottom: 10 }}>
          <h3>Ocupación general</h3>
          <span className="muted" style={{ fontSize: 13 }}>{stats.pct}% con disponibilidad reducida</span>
        </div>
        <div className="bar"><span style={{ width: `${stats.pct}%` }} /></div>
      </div>

      <div className="card">
        <div className="row-between" style={{ marginBottom: 4 }}>
          <h3>Agenda de hoy</h3>
          <span className="muted" style={{ fontSize: 13 }}>{new Date().toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })}</span>
        </div>
        {conReservasHoy.length === 0 ? (
          <p className="muted" style={{ fontSize: 14, margin: '8px 0 0' }}>No hay reservas para hoy. Todos los espacios están disponibles.</p>
        ) : (
          <div className="list">
            {conReservasHoy.map((s) => (
              <div className="list-row" key={s._id} style={{ alignItems: 'flex-start' }}>
                <div className="grow">
                  <b>{s.nombre}</b> <span className="muted">· {s.codigo} · {s.ubicacion?.edificio}, Piso {s.ubicacion?.piso}</span>
                  <div className="tags" style={{ marginTop: 8 }}>
                    {s.reservasHoy.map((r, i) => (
                      <span className="badge" key={i}>
                        {fmtHora(new Date(r.fechaInicio))}–{fmtHora(new Date(r.fechaFin))} · {r.usuario?.split('@')[0]}
                      </span>
                    ))}
                  </div>
                </div>
                <span className={`status status--${s.status}`}><span className="dot" />{STATUS_LABELS[s.status] || s.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default function Page() {
  return <AdminGuard><OcupacionDashboard /></AdminGuard>;
}
