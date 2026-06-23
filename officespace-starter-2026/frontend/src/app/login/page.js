'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '../../services/api';
import { saveSession } from '../../utils/auth';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ usuario: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(e) { setForm({ ...form, [e.target.name]: e.target.value }); }

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await authApi.login(form);
      saveSession(data);
      router.push('/spaces');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="center-screen dotgrid">
      <div style={{ width: '100%', maxWidth: 380 }} className="reveal">
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div className="brand-mark" style={{ width: 44, height: 44, borderRadius: 12, fontSize: 22, margin: '0 auto 16px' }}>O</div>
          <h1 style={{ fontSize: 26 }}>OfficeSpace</h1>
          <p className="muted" style={{ marginTop: 6 }}>Reserva de espacios · Corporativo Alpha</p>
        </div>

        <div className="card">
          <form onSubmit={submit}>
            <div className="field">
              <label>Usuario</label>
              <input name="usuario" type="email" placeholder="tu@corporativoalpha.com" value={form.usuario} onChange={update} required autoFocus />
            </div>
            <div className="field">
              <label>Contraseña</label>
              <input name="password" type="password" placeholder="••••••••" value={form.password} onChange={update} required />
            </div>

            {error && <div className="alert alert--error">{error}</div>}

            <button className="btn btn--block" type="submit" disabled={loading} style={{ marginTop: 8 }}>
              {loading ? 'Entrando…' : 'Entrar'}
            </button>
          </form>
        </div>

        <p className="muted" style={{ fontSize: 12.5, textAlign: 'center', marginTop: 18, lineHeight: 1.7 }}>
          Demo · <span className="mono">admin@corporativoalpha.com / Admin123</span><br />
          <span className="mono">carlos.mendez@corporativoalpha.com / User123</span>
        </p>
      </div>
    </div>
  );
}
