'use client';

import { useState } from 'react';

const DOW = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];
const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

function pad(n) { return String(n).padStart(2, '0'); }
// Clave local YYYY-MM-DD (sin desfase de zona horaria)
export function ymd(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }

// Calendario de selección de día con heatmap de disponibilidad.
//   value:    'YYYY-MM-DD' seleccionado (o '')
//   onChange(fecha)
//   levelFor(date) -> 'alta' | 'baja' | 'ninguna'  (color del punto del día)
export default function Calendar({ value, onChange, levelFor }) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const base = value ? new Date(`${value}T00:00`) : new Date();
  const [view, setView] = useState({ y: base.getFullYear(), m: base.getMonth() });

  const firstDay = new Date(view.y, view.m, 1);
  const offset = (firstDay.getDay() + 6) % 7; // semana empieza en lunes
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(view.y, view.m, d));
  while (cells.length % 7 !== 0) cells.push(null);

  function move(delta) {
    const m = view.m + delta;
    setView({ y: view.y + Math.floor(m / 12), m: ((m % 12) + 12) % 12 });
  }

  return (
    <div className="cal">
      <div className="cal-head">
        <button type="button" className="cal-nav" onClick={() => move(-1)} aria-label="Mes anterior">‹</button>
        <span className="cal-title">{MONTHS[view.m]} {view.y}</span>
        <button type="button" className="cal-nav" onClick={() => move(1)} aria-label="Mes siguiente">›</button>
      </div>

      <div className="cal-grid">
        {DOW.map((d, i) => <div className="cal-dow" key={i}>{d}</div>)}
        {cells.map((date, i) => {
          if (!date) return <div key={i} />;
          const key = ymd(date);
          const isPast = date < today;
          const level = !isPast && levelFor ? levelFor(date) : null;
          const cls = [
            'cal-day',
            value === key ? 'is-selected' : '',
            key === ymd(today) ? 'is-today' : '',
          ].join(' ');
          return (
            <button type="button" key={i} className={cls} disabled={isPast} onClick={() => onChange(key)}>
              {date.getDate()}
              {level && <span className={`cal-dot ${level}`} />}
            </button>
          );
        })}
      </div>

      <div className="cal-legend">
        <span><span className="d" style={{ background: 'var(--ok)' }} /> Disponibilidad alta</span>
        <span><span className="d" style={{ background: 'var(--warn)' }} /> Disponibilidad baja</span>
        <span><span className="d" style={{ background: 'var(--danger)' }} /> Sin disponibilidad</span>
      </div>
    </div>
  );
}
