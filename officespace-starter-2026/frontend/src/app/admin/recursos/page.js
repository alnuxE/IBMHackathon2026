'use client';

import { useEffect, useState } from 'react';
import AdminGuard from '../../../components/AdminGuard';
import { useToast } from '../../../components/Toast';
import { catalogApi } from '../../../services/api';
import { getToken } from '../../../utils/auth';

const EMPTY = { codigo: '', nombre: '', categoria: '', descripcion: '', activo: true };

function RecursosCrud() {
  const [recursos, setRecursos] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const toast = useToast();

  async function load() { setRecursos(await catalogApi.listRecursos(getToken())); }
  useEffect(() => { load().catch((e) => setError(e.message)); }, []);

  function resetForm() { setForm(EMPTY); setEditingId(null); }

  async function submit(e) {
    e.preventDefault();
    setError(''); setMsg('');
    try {
      if (editingId) { await catalogApi.updateRecurso(editingId, form, getToken()); toast('Recurso actualizado correctamente'); }
      else { await catalogApi.createRecurso(form, getToken()); toast('Recurso creado correctamente'); }
      resetForm();
      await load();
    } catch (err) { setError(err.message); toast(err.message, 'error'); }
  }

  function startEdit(r) {
    setEditingId(r._id);
    setForm({ codigo: r.codigo, nombre: r.nombre, categoria: r.categoria || '', descripcion: r.descripcion || '', activo: r.activo });
    setError(''); setMsg('');
  }

  async function borrar(r) {
    if (!confirm(`¿Eliminar el recurso ${r.nombre}?`)) return;
    setError(''); setMsg('');
    try { await catalogApi.removeRecurso(r._id, getToken()); await load(); toast('Recurso eliminado'); }
    catch (err) { setError(err.message); toast(err.message, 'error'); }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 360px) minmax(0, 1fr)', gap: 16, alignItems: 'start' }} className="detail-grid">
      <div className="card">
        <h3 style={{ marginBottom: 14 }}>{editingId ? 'Editar recurso' : 'Nuevo recurso'}</h3>
        <form onSubmit={submit}>
          <div className="field">
            <label>Código</label>
            <input value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} placeholder="REC-PROYECTOR" required />
          </div>
          <div className="field">
            <label>Nombre</label>
            <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Proyector" required />
          </div>
          <div className="field">
            <label>Categoría</label>
            <input value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} placeholder="audiovisual, cómputo…" />
          </div>
          <div className="field">
            <label>Descripción</label>
            <input value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} placeholder="Opcional" />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} /> Activo
          </label>
          {error && <div className="alert alert--error">{error}</div>}
          {msg && <div className="alert alert--ok">{msg}</div>}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="btn" type="submit">{editingId ? 'Guardar' : 'Crear recurso'}</button>
            {editingId && <button type="button" className="btn btn--ghost" onClick={resetForm}>Cancelar</button>}
          </div>
        </form>
      </div>

      <div className="card">
        <div className="row-between" style={{ marginBottom: 4 }}>
          <h3>Catálogo de recursos</h3>
          <span className="muted" style={{ fontSize: 13 }}>{recursos.length} recursos</span>
        </div>
        <div className="list">
          {recursos.map((r) => (
            <div className="list-row" key={r._id}>
              <span className="mono muted" style={{ width: 120, fontSize: 12.5 }}>{r.codigo}</span>
              <span className="grow"><b>{r.nombre}</b>{r.categoria && <span className="muted"> · {r.categoria}</span>}</span>
              {!r.activo && <span className="status status--finalizada">inactivo</span>}
              <button className="btn btn--ghost btn--sm" onClick={() => startEdit(r)}>Editar</button>
              <button className="btn btn--danger btn--sm" onClick={() => borrar(r)}>Borrar</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return <AdminGuard><RecursosCrud /></AdminGuard>;
}
