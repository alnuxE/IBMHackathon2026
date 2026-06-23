'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { catalogApi, reservaApi } from '../../services/api';
import { getToken } from '../../utils/auth';

const TIPO_LABELS = { sala_juntas: 'Sala de juntas', escritorio_individual: 'Escritorio' };
const STATUS_LABELS = { alta: 'Disp. alta', baja: 'Disp. baja', ninguna: 'Sin disp.' };

function pad(n) { return String(n).padStart(2, '0'); }
function ymdLocal(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }

function norm(s) {
  return (s || '').toString().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export default function SpacesPage() {
  const router = useRouter();
  const [spaces, setSpaces] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Filtros
  const [q, setQ] = useState('');
  const [tipo, setTipo] = useState('');
  const [capMin, setCapMin] = useState('');
  const [fecha, setFecha] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');

  // Disponibilidad
  const [ocupados, setOcupados] = useState(null); // Set de spaceId o null (sin ventana)
  const [winError, setWinError] = useState('');
  const [checking, setChecking] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push('/login'); return; }
    catalogApi.listSpaces(token)
      .then(setSpaces)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Ventana horaria válida -> consulta espacios ocupados
  useEffect(() => {
    setWinError('');
    if (!fecha || !desde || !hasta) { setOcupados(null); return; }
    const inicio = new Date(`${fecha}T${desde}`);
    const fin = new Date(`${fecha}T${hasta}`);
    if (fin <= inicio) { setOcupados(null); setWinError('La hora de fin debe ser posterior a la de inicio.'); return; }

    let cancel = false;
    setChecking(true);
    reservaApi.ocupados(inicio.toISOString(), fin.toISOString(), getToken())
      .then((ids) => { if (!cancel) setOcupados(new Set(ids)); })
      .catch((err) => { if (!cancel) setWinError(err.message); })
      .finally(() => { if (!cancel) setChecking(false); });
    return () => { cancel = true; };
  }, [fecha, desde, hasta]);

  const filtered = useMemo(() => {
    const term = norm(q).trim();
    return spaces.filter((s) => {
      if (tipo && s.tipo !== tipo) return false;
      if (capMin && s.capacidad < Number(capMin)) return false;
      if (ocupados && ocupados.has(s._id)) return false; // solo disponibles en la ventana
      if (term) {
        const haystack = norm([
          s.codigo, s.nombre, TIPO_LABELS[s.tipo], s.tipo, STATUS_LABELS[s.status],
          s.ubicacion?.edificio, `piso ${s.ubicacion?.piso}`, s.ubicacion?.numEscritorio,
          (s.recursos || []).map((r) => r.nombre).join(' '),
        ].join(' '));
        if (!term.split(/\s+/).every((w) => haystack.includes(w))) return false;
      }
      return true;
    });
  }, [spaces, q, tipo, capMin, ocupados]);

  const filtrosActivos = q || tipo || capMin || fecha || desde || hasta;
  const numFiltros = [tipo, capMin, fecha, desde, hasta].filter(Boolean).length;
  function limpiar() { setQ(''); setTipo(''); setCapMin(''); setFecha(''); setDesde(''); setHasta(''); }

  if (loading) return <div className="loading"><span className="spinner" /> Cargando espacios…</div>;
  if (error) return <div className="alert alert--error">{error}</div>;

  return (
    <>
      <div className="page-head row-between">
        <div>
          <span className="eyebrow">Corporativo Alpha</span>
          <h1>Espacios</h1>
          <p className="muted">Busca por disponibilidad y reserva en segundos.</p>
        </div>
        <span className="status status--libre"><span className="dot" />{filtered.length} de {spaces.length}</span>
      </div>

      <div className="search">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre, tipo, ubicación o recurso…" aria-label="Buscar espacios" />
        {q && <button type="button" className="clear" onClick={() => setQ('')} aria-label="Limpiar búsqueda">✕</button>}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: showFilters ? 12 : 24 }}>
        <button
          type="button"
          className={showFilters ? 'btn btn--sm' : 'btn btn--ghost btn--sm'}
          onClick={() => setShowFilters((v) => !v)}
          aria-expanded={showFilters}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          Filtros{numFiltros > 0 ? ` · ${numFiltros}` : ''}
        </button>
      </div>

      {showFilters && (
      <div className="card reveal" style={{ marginBottom: 24 }}>
        <div className="row-between" style={{ marginBottom: 4 }}>
          <span className="eyebrow">Paso 1 · ¿Cuándo lo necesitas?</span>
          {filtrosActivos && <button type="button" className="btn btn--ghost btn--sm" onClick={limpiar}>Limpiar</button>}
        </div>
        <p className="muted" style={{ fontSize: 13, margin: '0 0 12px' }}>
          Elige fecha y horario y te mostramos <b>solo los espacios libres</b>. ¿Sin prisa? Deja las horas vacías y filtra por tipo o capacidad.
        </p>
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => setFecha(ymdLocal(new Date()))}>Hoy</button>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => setFecha(ymdLocal(new Date(Date.now() + 86400000)))}>Mañana</button>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => { setDesde('09:00'); setHasta('10:00'); }}>09:00–10:00</button>
        </div>
        <div className="field-grid">
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Fecha</label>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Desde</label>
            <input type="time" step="900" value={desde} onChange={(e) => setDesde(e.target.value)} />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Hasta</label>
            <input type="time" step="900" value={hasta} onChange={(e) => setHasta(e.target.value)} />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Tipo</label>
            <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
              <option value="">Todos</option>
              <option value="sala_juntas">Sala de juntas</option>
              <option value="escritorio_individual">Escritorio</option>
            </select>
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Capacidad mínima</label>
            <input type="number" min="1" value={capMin} onChange={(e) => setCapMin(e.target.value)} placeholder="cualquiera" />
          </div>
        </div>
        {winError && <div className="alert alert--error" style={{ marginTop: 12, marginBottom: 0 }}>{winError}</div>}
        {ocupados && !winError && (
          <p className="muted" style={{ fontSize: 13, margin: '12px 0 0' }}>
            {checking ? 'Comprobando disponibilidad…' : `Mostrando solo espacios libres el ${fecha} de ${desde} a ${hasta}.`}
          </p>
        )}
      </div>
      )}

      {filtered.length === 0 ? (
        <div className="empty">
          {spaces.length === 0
            ? 'Aún no hay espacios. Pide a un administrador que cree el primero.'
            : ocupados
              ? 'Ningún espacio cumple los filtros y está libre en ese horario.'
              : 'No hay espacios que coincidan con los filtros.'}
        </div>
      ) : (
        <div className="grid">
          {filtered.map((s, i) => (
            <Link key={s._id} href={`/spaces/${s._id}`} className="card card-link reveal" style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}>
              <div className="row-between" style={{ marginBottom: 10 }}>
                <span className="eyebrow">{s.codigo}</span>
                <span className={`status status--${s.status}`}><span className="dot" />{STATUS_LABELS[s.status] || s.status}</span>
              </div>
              <h3 style={{ marginBottom: 8 }}>{s.nombre}</h3>
              <p className="muted" style={{ margin: '0 0 14px', fontSize: 13.5 }}>
                {TIPO_LABELS[s.tipo] || s.tipo} · {s.capacidad} {s.capacidad === 1 ? 'persona' : 'personas'}
                <br />
                {s.ubicacion?.edificio} · Piso {s.ubicacion?.piso}
                {s.ubicacion?.numEscritorio ? ` · ${s.ubicacion.numEscritorio}` : ''}
              </p>
              <div className="tags">
                {(s.recursos || []).slice(0, 4).map((r) => (
                  <span className="badge" key={r.codigo}>{r.nombre}{r.cantidad > 1 ? ` ×${r.cantidad}` : ''}</span>
                ))}
                {(s.recursos || []).length > 4 && <span className="badge">+{s.recursos.length - 4}</span>}
              </div>
              <span className="go">Ver y reservar →</span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
