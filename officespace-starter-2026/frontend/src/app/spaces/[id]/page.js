'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Calendar, { ymd } from '../../../components/Calendar';
import { useToast } from '../../../components/Toast';
import { catalogApi, reservaApi } from '../../../services/api';
import { getToken } from '../../../utils/auth';

const TIPO_LABELS = { sala_juntas: 'Sala de juntas', escritorio_individual: 'Escritorio individual' };
const STATUS_LABELS = { alta: 'Disponibilidad alta', baja: 'Disponibilidad baja', ninguna: 'Sin disponibilidad' };
const DAY_MS = 86400000;
const JORNADA_INI = 7;   // 07:00
const JORNADA_FIN = 22;  // 22:00

function pad(n) { return String(n).padStart(2, '0'); }
function fmtHora(d) { return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }

export default function SpaceDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [space, setSpace] = useState(null);
  const [reservas, setReservas] = useState([]);
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [duracion, setDuracion] = useState(1);
  const [asistentes, setAsistentes] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  async function loadData() {
    const token = getToken();
    const [sp, rs] = await Promise.all([catalogApi.getSpace(id, token), reservaApi.bySpace(id, token)]);
    setSpace(sp);
    setReservas(rs);
  }

  useEffect(() => {
    if (!getToken()) { router.push('/login'); return; }
    loadData().catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, [id]);

  // Nivel de disponibilidad de un día (mismo criterio que el backend: jornada 9–18)
  function nivelDia(dateObj) {
    const ini = new Date(dateObj); ini.setHours(JORNADA_INI, 0, 0, 0);
    const fin = new Date(dateObj); fin.setHours(JORNADA_FIN, 0, 0, 0);
    const jornada = fin - ini;
    let ocupado = 0;
    reservas.forEach((r) => {
      const s = new Date(r.fechaInicio), e = new Date(r.fechaFin);
      const ov = Math.min(e.getTime(), fin.getTime()) - Math.max(s.getTime(), ini.getTime());
      if (ov > 0) ocupado += ov;
    });
    if (ocupado <= 0) return 'alta';
    if (ocupado >= jornada) return 'ninguna';
    return 'baja';
  }

  // Franjas ocupadas del día seleccionado
  const ocupados = useMemo(() => {
    if (!fecha) return [];
    const ds = new Date(`${fecha}T00:00`);
    const de = new Date(ds.getTime() + DAY_MS);
    return reservas
      .filter((r) => new Date(r.fechaInicio) < de && new Date(r.fechaFin) > ds)
      .sort((a, b) => new Date(a.fechaInicio) - new Date(b.fechaInicio));
  }, [reservas, fecha]);

  // Horarios libres (sugerencias) por hora dentro de la jornada
  const libres = useMemo(() => {
    if (!fecha) return [];
    const out = [];
    for (let h = JORNADA_INI; h < JORNADA_FIN; h++) {
      const s = new Date(`${fecha}T${pad(h)}:00`);
      const e = new Date(s.getTime() + 3600000);
      const choca = reservas.some((r) => new Date(r.fechaInicio) < e && new Date(r.fechaFin) > s);
      if (!choca && s > new Date()) out.push({ h, label: `${pad(h)}:00` });
    }
    return out;
  }, [reservas, fecha]);

  const resumen = useMemo(() => {
    if (!fecha || !hora) return null;
    const start = new Date(`${fecha}T${hora}`);
    if (isNaN(start)) return null;
    return { start, end: new Date(start.getTime() + duracion * 3600000) };
  }, [fecha, hora, duracion]);

  async function reservar(e) {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!fecha) { setError('Elige un día en el calendario.'); return; }
    if (!hora) { setError('Elige una hora de inicio (toca una sugerencia o usa el campo de hora).'); return; }
    if (Number(asistentes) > space.capacidad) {
      setError(`Los asistentes (${asistentes}) exceden la capacidad del espacio (${space.capacidad}).`);
      return;
    }
    const token = getToken();
    if (!token) { router.push('/login'); return; }

    setSaving(true);
    try {
      await reservaApi.create(
        { spaceId: id, fechaInicio: resumen.start.toISOString(), fechaFin: resumen.end.toISOString(), asistentes: Number(asistentes) },
        token
      );
      setSuccess('Reserva confirmada. La verás en “Mis reservas”.');
      toast('¡Reserva confirmada!');
      setFecha(''); setHora(''); setDuracion(1); setAsistentes(1);
      await loadData();
    } catch (err) {
      setError(err.message);
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="loading"><span className="spinner" /> Cargando…</div>;
  if (!space) return <div className="alert alert--error">{error || 'Espacio no encontrado'}</div>;

  return (
    <div className="reveal">
      <Link href="/spaces" className="nav-link" style={{ display: 'inline-block', padding: '6px 0', marginBottom: 12, color: 'var(--muted)' }}>← Volver</Link>

      <div className="page-head row-between">
        <div>
          <span className="eyebrow">{space.codigo}</span>
          <h1>{space.nombre}</h1>
          <p className="muted">
            {TIPO_LABELS[space.tipo] || space.tipo} · {space.capacidad} personas · {space.ubicacion?.edificio}, Piso {space.ubicacion?.piso}
            {space.ubicacion?.numEscritorio ? ` · Escritorio ${space.ubicacion.numEscritorio}` : ''}
          </p>
        </div>
        <span className={`status status--${space.status}`}><span className="dot" />{STATUS_LABELS[space.status] || space.status}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', gap: 16, alignItems: 'start' }} className="detail-grid">
        <form className="card" onSubmit={reservar}>
          <h3 style={{ marginBottom: 4 }}>1 · Elige el día</h3>
          <p className="muted" style={{ fontSize: 13, margin: '0 0 14px' }}>El color de cada día indica cuánta disponibilidad queda.</p>
          <Calendar value={fecha} onChange={(d) => { setFecha(d); setHora(''); setError(''); }} levelFor={nivelDia} />

          {fecha && (
            <div style={{ marginTop: 20 }}>
              <h3 style={{ marginBottom: 8 }}>2 · Elige un horario libre</h3>
              {libres.length === 0 ? (
                <p className="muted" style={{ fontSize: 13, margin: 0 }}>No quedan horas libres este día. Prueba con otra fecha.</p>
              ) : (
                <div className="slots">
                  {libres.map((s) => (
                    <button
                      type="button"
                      key={s.h}
                      className={`slot free ${hora === s.label ? 'is-picked' : ''}`}
                      onClick={() => setHora(s.label)}
                    >
                      <span className="d" />{s.label}
                    </button>
                  ))}
                </div>
              )}

              {ocupados.length > 0 && (
                <>
                  <p className="muted" style={{ fontSize: 12.5, margin: '14px 0 6px' }}>Ya ocupado:</p>
                  <div className="slots">
                    {ocupados.map((r) => (
                      <span className="slot" key={r._id}>
                        <span className="d" />{fmtHora(new Date(r.fechaInicio))}–{fmtHora(new Date(r.fechaFin))}
                      </span>
                    ))}
                  </div>
                </>
              )}

              <h3 style={{ margin: '20px 0 8px' }}>3 · Duración y asistentes</h3>
              <div className="field-grid">
                <div className="field">
                  <label>Hora de inicio</label>
                  <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} step="900" required />
                </div>
                <div className="field">
                  <label>Duración (máx. 8 h)</label>
                  <select value={duracion} onChange={(e) => setDuracion(Number(e.target.value))}>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((h) => <option key={h} value={h}>{h} {h === 1 ? 'hora' : 'horas'}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Asistentes (máx. {space.capacidad})</label>
                  <input type="number" min="1" max={space.capacidad} value={asistentes} onChange={(e) => setAsistentes(e.target.value)} required />
                </div>
              </div>

              {error && <div className="alert alert--error">{error}</div>}
              {success && <div className="alert alert--ok">{success}</div>}
              <button className="btn btn--block" type="submit" disabled={saving} style={{ marginTop: 6 }}>
                {saving ? 'Confirmando…' : 'Confirmar reserva'}
              </button>
            </div>
          )}

          {!fecha && (error || success) && (
            <div style={{ marginTop: 14 }}>
              {error && <div className="alert alert--error">{error}</div>}
              {success && <div className="alert alert--ok">{success}</div>}
            </div>
          )}
        </form>

        <div>
          <div className="card">
            <span className="eyebrow">Resumen</span>
            {resumen ? (
              <div style={{ marginTop: 10 }}>
                <p style={{ margin: '0 0 4px', fontWeight: 600, textTransform: 'capitalize' }}>
                  {resumen.start.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
                <p className="muted" style={{ margin: 0 }}>
                  {fmtHora(resumen.start)} – {fmtHora(resumen.end)} · {duracion} {duracion === 1 ? 'hora' : 'horas'}
                </p>
                <p className="muted" style={{ margin: '4px 0 0' }}>
                  {asistentes} {Number(asistentes) === 1 ? 'asistente' : 'asistentes'} · capacidad {space.capacidad}
                </p>
              </div>
            ) : (
              <p className="muted" style={{ fontSize: 13, margin: '10px 0 0' }}>Elige día y hora para ver el resumen.</p>
            )}
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 12 }}>Recursos</h3>
            <div className="tags">
              {(space.recursos || []).length === 0
                ? <span className="muted" style={{ fontSize: 13 }}>Sin recursos asignados.</span>
                : space.recursos.map((r) => <span className="badge" key={r.codigo}>{r.nombre}{r.cantidad > 1 ? ` ×${r.cantidad}` : ''}</span>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
