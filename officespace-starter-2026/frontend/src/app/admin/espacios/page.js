'use client';

import { useEffect, useState } from 'react';
import AdminGuard from '../../../components/AdminGuard';
import { useToast } from '../../../components/Toast';
import { catalogApi } from '../../../services/api';
import { getToken } from '../../../utils/auth';

const TIPOS = [
  { value: 'sala_juntas', label: 'Sala de juntas' },
  { value: 'escritorio_individual', label: 'Escritorio individual' },
];
const STATUS_LABELS = { alta: 'Disp. alta', baja: 'Disp. baja', ninguna: 'Sin disp.' };
const EMPTY = { codigo: '', nombre: '', tipo: 'sala_juntas', capacidad: 1, edificio: '', piso: 1, numEscritorio: '' };

function EspaciosCrud() {
  const [spaces, setSpaces] = useState([]);
  const [recursos, setRecursos] = useState([]);
  const [sel, setSel] = useState({});
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const toast = useToast();

  async function load() {
    const token = getToken();
    const [sp, rec] = await Promise.all([catalogApi.listSpaces(token), catalogApi.listRecursos(token)]);
    setSpaces(sp); setRecursos(rec);
  }
  useEffect(() => { load().catch((e) => setError(e.message)); }, []);

  function resetForm() { setForm(EMPTY); setSel({}); setEditingId(null); }

  function toggleRecurso(codigo, checked) {
    setSel((prev) => {
      const next = { ...prev };
      if (checked) next[codigo] = next[codigo] || 1; else delete next[codigo];
      return next;
    });
  }

  function buildBody() {
    const recursosArr = Object.entries(sel).map(([codigo, cantidad]) => {
      const r = recursos.find((x) => x.codigo === codigo);
      return { recursoId: r._id, codigo: r.codigo, nombre: r.nombre, cantidad: Number(cantidad) || 1 };
    });
    return {
      codigo: form.codigo, nombre: form.nombre, tipo: form.tipo,
      capacidad: Number(form.capacidad),
      ubicacion: { edificio: form.edificio, piso: Number(form.piso), numEscritorio: form.numEscritorio || null },
      recursos: recursosArr,
      // status (disponibilidad) lo deriva el sistema según las reservas
    };
  }

  async function submit(e) {
    e.preventDefault();
    setError(''); setMsg('');
    try {
      if (editingId) { await catalogApi.updateSpace(editingId, buildBody(), getToken()); toast('Espacio actualizado correctamente'); }
      else { await catalogApi.createSpace(buildBody(), getToken()); toast('Espacio creado correctamente'); }
      resetForm();
      await load();
    } catch (err) { setError(err.message); toast(err.message, 'error'); }
  }

  function startEdit(s) {
    setEditingId(s._id);
    setForm({
      codigo: s.codigo, nombre: s.nombre, tipo: s.tipo, capacidad: s.capacidad,
      edificio: s.ubicacion?.edificio || '', piso: s.ubicacion?.piso || 1, numEscritorio: s.ubicacion?.numEscritorio || '',
    });
    const map = {};
    (s.recursos || []).forEach((r) => { map[r.codigo] = r.cantidad; });
    setSel(map);
    setError(''); setMsg('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function borrar(s) {
    if (!confirm(`¿Eliminar el espacio ${s.nombre}?`)) return;
    setError(''); setMsg('');
    try { await catalogApi.removeSpace(s._id, getToken()); await load(); toast('Espacio eliminado'); }
    catch (err) { setError(err.message); toast(err.message, 'error'); }
  }

  return (
    <>
      <div className="card">
        <h3 style={{ marginBottom: 14 }}>{editingId ? `Editar espacio · ${form.codigo}` : 'Nuevo espacio'}</h3>
        <form onSubmit={submit}>
          <div className="field-grid">
            <div className="field"><label>Código</label><input value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} placeholder="ESP-004" required /></div>
            <div className="field" style={{ gridColumn: 'span 2' }}><label>Nombre</label><input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Sala de Juntas…" required /></div>
          </div>
          <div className="field-grid">
            <div className="field"><label>Tipo</label><select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>{TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
            <div className="field"><label>Capacidad</label><input type="number" min="1" value={form.capacidad} onChange={(e) => setForm({ ...form, capacidad: e.target.value })} required /></div>
          </div>
          <div className="field-grid">
            <div className="field"><label>Edificio</label><input value={form.edificio} onChange={(e) => setForm({ ...form, edificio: e.target.value })} placeholder="Torre A" required /></div>
            <div className="field"><label>Piso</label><input type="number" value={form.piso} onChange={(e) => setForm({ ...form, piso: e.target.value })} required /></div>
            <div className="field"><label>N° escritorio</label><input value={form.numEscritorio} onChange={(e) => setForm({ ...form, numEscritorio: e.target.value })} placeholder="opcional" /></div>
          </div>

          <label>Recursos del espacio</label>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 8, marginBottom: 14 }}>
            {recursos.map((r) => {
              const checked = sel[r.codigo] !== undefined;
              return (
                <label key={r._id} style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '8px 10px', margin: 0, cursor: 'pointer', background: checked ? 'var(--bg-subtle)' : 'var(--bg)' }}>
                  <input type="checkbox" checked={checked} onChange={(e) => toggleRecurso(r.codigo, e.target.checked)} />
                  <span style={{ flex: 1, fontSize: 13 }}>{r.nombre}</span>
                  {checked && <input type="number" min="1" style={{ width: 52, height: 30 }} value={sel[r.codigo]} onChange={(e) => setSel({ ...sel, [r.codigo]: e.target.value })} onClick={(e) => e.preventDefault()} />}
                </label>
              );
            })}
          </div>

          {error && <div className="alert alert--error">{error}</div>}
          {msg && <div className="alert alert--ok">{msg}</div>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" type="submit">{editingId ? 'Guardar cambios' : 'Crear espacio'}</button>
            {editingId && <button type="button" className="btn btn--ghost" onClick={resetForm}>Cancelar</button>}
          </div>
        </form>
      </div>

      <div className="card">
        <div className="row-between" style={{ marginBottom: 4 }}>
          <h3>Espacios</h3>
          <span className="muted" style={{ fontSize: 13 }}>{spaces.length} espacios</span>
        </div>
        <div className="list">
          {spaces.map((s) => (
            <div className="list-row" key={s._id}>
              <span className="mono muted" style={{ width: 80, fontSize: 12.5 }}>{s.codigo}</span>
              <span className="grow"><b>{s.nombre}</b><span className="sub"> · {s.tipo === 'sala_juntas' ? 'Sala' : 'Escritorio'} · cap. {s.capacidad}</span></span>
              <span className={`status status--${s.status}`}><span className="dot" />{STATUS_LABELS[s.status] || s.status}</span>
              <button className="btn btn--ghost btn--sm" onClick={() => startEdit(s)}>Editar</button>
              <button className="btn btn--danger btn--sm" onClick={() => borrar(s)}>Borrar</button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default function Page() {
  return <AdminGuard><EspaciosCrud /></AdminGuard>;
}
