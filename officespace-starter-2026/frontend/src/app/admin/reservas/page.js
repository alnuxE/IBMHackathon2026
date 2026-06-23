'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import AdminGuard from '../../../components/AdminGuard';
import { useToast } from '../../../components/Toast';
import { reservaApi } from '../../../services/api';
import { getToken } from '../../../utils/auth';

const STATUS_LABELS = {
  programada: 'Programada', progreso: 'En curso', finalizada: 'Finalizada', cancelada: 'Cancelada',
};

function fInicio(r) { return new Date(r.fechaInicio); }
function fFin(r) { return new Date(r.fechaFin); }
function fmtFecha(d) { return d.toLocaleDateString(); }
function fmtHora(d) { return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }

function toRows(reservas) {
  return reservas.map((r) => ({
    'Codigo': r.spaceCodigo || '',
    'Espacio': r.spaceNombre || '',
    'Usuario': r.usuario || '',
    'FechaInicio': fInicio(r).toISOString(),
    'FechaFin': fFin(r).toISOString(),
    'Asistentes': r.asistentes ?? '',
    'Estado': STATUS_LABELS[r.status] || r.status,
  }));
}

function descargar(blob, nombre) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = nombre; a.click();
  URL.revokeObjectURL(url);
}

function ReservasAdmin() {
  const [reservas, setReservas] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [resultado, setResultado] = useState(null);
  const fileRef = useRef(null);
  const toast = useToast();

  async function cargar() {
    setReservas(await reservaApi.all(getToken()));
  }

  useEffect(() => {
    cargar().catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  const visibles = useMemo(
    () => (filtro ? reservas.filter((r) => r.status === filtro) : reservas),
    [reservas, filtro]
  );

  function exportarCSV() {
    const rows = toRows(visibles);
    const cols = ['Codigo', 'Espacio', 'Usuario', 'FechaInicio', 'FechaFin', 'Asistentes', 'Estado'];
    const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n');
    descargar(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' }), 'reservas_officespace.csv');
  }

  function exportarExcel() {
    const ws = XLSX.utils.json_to_sheet(toRows(visibles));
    ws['!cols'] = [{ wch: 10 }, { wch: 26 }, { wch: 34 }, { wch: 24 }, { wch: 24 }, { wch: 11 }, { wch: 12 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reservas');
    XLSX.writeFile(wb, 'reservas_officespace.xlsx');
  }

  async function onFile(e) {
    const file = e.target.files?.[0];
    if (e.target) e.target.value = '';
    if (!file) return;
    setImporting(true); setResultado(null); setError('');
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(ws, { raw: false, defval: '' });
      const rows = json.map((r) => ({
        spaceCodigo: r.Codigo || r['Código'] || r.spaceCodigo || '',
        usuario: r.Usuario || r.usuario || '',
        fechaInicio: r.FechaInicio || r.fechaInicio || r.Inicio || '',
        fechaFin: r.FechaFin || r.fechaFin || r.Fin || '',
        asistentes: Number(r.Asistentes || r.asistentes || 0),
      })).filter((r) => r.spaceCodigo && r.fechaInicio && r.fechaFin);

      if (!rows.length) {
        setError('No se encontraron filas válidas. Columnas esperadas: Codigo, Usuario, FechaInicio, FechaFin, Asistentes.');
        return;
      }
      const res = await reservaApi.importar(rows, getToken());
      setResultado(res);
      await cargar();
      toast(`${res.importadas} reservas importadas${res.rechazadas?.length ? ` · ${res.rechazadas.length} rechazadas` : ''}`,
        res.importadas > 0 ? 'success' : 'error');
    } catch (err) {
      setError(err.message);
      toast(err.message, 'error');
    } finally {
      setImporting(false);
    }
  }

  if (loading) return <div className="loading"><span className="spinner" /> Cargando reservas…</div>;

  return (
    <>
      <div className="card" style={{ background: 'var(--bg-subtle)' }}>
        <span className="eyebrow">Del Excel compartido al sistema</span>
        <p style={{ margin: '8px 0 0', fontSize: 14 }}>
          ¿Vienes de un Excel compartido? <b>Impórtalo</b> y el sistema migra todas las reservas
          (validando capacidad y fechas). A partir de ahí gestiona todo aquí y, cuando quieras,
          <b> exportas el Excel</b> con un clic — siempre actualizado.
        </p>
        <p className="muted" style={{ fontSize: 12.5, margin: '8px 0 0' }}>
          Columnas del archivo: <span className="mono">Codigo, Usuario, FechaInicio, FechaFin, Asistentes</span> (Excel .xlsx o .csv).
        </p>
      </div>

      {error && <div className="alert alert--error">{error}</div>}
      {resultado && (
        <div className="alert alert--ok">
          Importación: <b>{resultado.importadas}</b> de {resultado.total} reservas cargadas.
          {resultado.rechazadas?.length > 0 && (
            <> {resultado.rechazadas.length} rechazadas (p.ej. fila {resultado.rechazadas[0].fila}: {resultado.rechazadas[0].motivo}).</>
          )}
        </div>
      )}

      <div className="card">
        <div className="row-between" style={{ marginBottom: 14, gap: 12 }}>
          <div>
            <h3>Todas las reservas</h3>
            <span className="muted" style={{ fontSize: 13 }}>{visibles.length} de {reservas.length} registros</span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <select value={filtro} onChange={(e) => setFiltro(e.target.value)} style={{ width: 'auto', height: 38 }}>
              <option value="">Todos los estados</option>
              <option value="programada">Programadas</option>
              <option value="progreso">En curso</option>
              <option value="finalizada">Finalizadas</option>
              <option value="cancelada">Canceladas</option>
            </select>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={onFile} style={{ display: 'none' }} />
            <button className="btn btn--ghost btn--sm" onClick={() => fileRef.current?.click()} disabled={importing}>
              {importing ? 'Importando…' : 'Importar Excel'}
            </button>
            <button className="btn btn--ghost btn--sm" onClick={exportarCSV} disabled={!visibles.length}>Exportar CSV</button>
            <button className="btn btn--sm" onClick={exportarExcel} disabled={!visibles.length}>Exportar Excel</button>
          </div>
        </div>

        {visibles.length === 0 ? (
          <div className="empty">No hay reservas. Importa tu Excel para empezar.</div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Código</th><th>Espacio</th><th>Usuario</th><th>Fecha</th>
                  <th>Inicio</th><th>Fin</th><th>Asist.</th><th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((r) => (
                  <tr key={r._id}>
                    <td className="mono muted">{r.spaceCodigo}</td>
                    <td><b>{r.spaceNombre}</b></td>
                    <td>{r.usuario}</td>
                    <td>{fmtFecha(fInicio(r))}</td>
                    <td>{fmtHora(fInicio(r))}</td>
                    <td>{fmtHora(fFin(r))}</td>
                    <td>{r.asistentes}</td>
                    <td><span className={`status status--${r.status}`}><span className="dot" />{STATUS_LABELS[r.status] || r.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

export default function Page() {
  return <AdminGuard><ReservasAdmin /></AdminGuard>;
}
