'use client';

import { useEffect, useState } from 'react';
import AdminGuard from '../../../components/AdminGuard';
import { useToast } from '../../../components/Toast';
import { usersApi } from '../../../services/api';
import { getToken } from '../../../utils/auth';

const ROLES = ['COLABORADOR', 'ADMINISTRADOR'];
const EMPTY = { usuario: '', password: '', rol: 'COLABORADOR' };

function UsuariosCrud() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const toast = useToast();

  async function load() { setUsers(await usersApi.list(getToken())); }
  useEffect(() => { load().catch((e) => setError(e.message)); }, []);

  function resetForm() { setForm(EMPTY); setEditingId(null); }

  async function submit(e) {
    e.preventDefault();
    setError(''); setMsg('');
    try {
      if (editingId) {
        const body = { rol: form.rol };
        if (form.password) body.password = form.password;
        await usersApi.update(editingId, body, getToken());
        toast('Usuario actualizado correctamente');
      } else {
        await usersApi.create(form, getToken());
        toast('Usuario creado correctamente');
      }
      resetForm();
      await load();
    } catch (err) { setError(err.message); toast(err.message, 'error'); }
  }

  function startEdit(u) {
    setEditingId(u._id);
    setForm({ usuario: u.usuario, password: '', rol: u.rol });
    setError(''); setMsg('');
  }

  async function borrar(u) {
    if (!confirm(`¿Eliminar a ${u.usuario}?`)) return;
    setError(''); setMsg('');
    try { await usersApi.remove(u._id, getToken()); await load(); toast('Usuario eliminado'); }
    catch (err) { setError(err.message); toast(err.message, 'error'); }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 360px) minmax(0, 1fr)', gap: 16, alignItems: 'start' }} className="detail-grid">
      <div className="card">
        <h3 style={{ marginBottom: 14 }}>{editingId ? 'Editar usuario' : 'Nuevo usuario'}</h3>
        <form onSubmit={submit}>
          <div className="field">
            <label>Usuario (correo)</label>
            <input type="email" value={form.usuario} onChange={(e) => setForm({ ...form, usuario: e.target.value })} disabled={!!editingId} placeholder="nombre@corporativoalpha.com" required />
          </div>
          <div className="field">
            <label>Contraseña {editingId && <span className="muted">· vacío = sin cambios</span>}</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••" required={!editingId} />
          </div>
          <div className="field">
            <label>Rol</label>
            <select value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })}>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          {error && <div className="alert alert--error">{error}</div>}
          {msg && <div className="alert alert--ok">{msg}</div>}
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <button className="btn" type="submit">{editingId ? 'Guardar' : 'Crear usuario'}</button>
            {editingId && <button type="button" className="btn btn--ghost" onClick={resetForm}>Cancelar</button>}
          </div>
        </form>
      </div>

      <div className="card">
        <div className="row-between" style={{ marginBottom: 4 }}>
          <h3>Usuarios</h3>
          <span className="muted" style={{ fontSize: 13 }}>{users.length} en total</span>
        </div>
        <div className="list">
          {users.map((u) => (
            <div className="list-row" key={u._id}>
              <span className="grow"><b>{u.usuario}</b></span>
              <span className={`status ${u.rol === 'ADMINISTRADOR' ? 'status--reservado' : 'status--libre'}`}><span className="dot" />{u.rol}</span>
              <button className="btn btn--ghost btn--sm" onClick={() => startEdit(u)}>Editar</button>
              <button className="btn btn--danger btn--sm" onClick={() => borrar(u)}>Borrar</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return <AdminGuard><UsuariosCrud /></AdminGuard>;
}
