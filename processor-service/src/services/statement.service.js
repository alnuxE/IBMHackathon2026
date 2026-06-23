// Estado de cuenta (estado de cuenta / facturación) estilo industria.
//
// Se construye desde el LEDGER autoritativo (applied_operations del accounts-service),
// que registra cada movimiento de saldo con su saldo antes/después. Esto permite un
// estado de cuenta bancario real: saldo inicial → movimientos con saldo corriente →
// saldo final, incluyendo recargas y transferencias (cargos y abonos).

const PDFDocument = require('pdfkit');
const accountsClient = require('../clients/accounts.client');

// ── helpers de formato (deterministas, sin depender de ICU) ──────────────────
function money(n) {
  if (n == null) return '—';
  const v = Number(n);
  const [int, dec] = Math.abs(v).toFixed(2).split('.');
  const sep = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${v < 0 ? '-' : ''}$${sep}.${dec}`;
}
const pad = (n) => String(n).padStart(2, '0');
function fecha(v) {
  const d = new Date(v);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function fechaCorta(v) {
  const d = new Date(v);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${String(d.getFullYear()).slice(2)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
const round2 = (n) => Math.round(n * 100) / 100;

// Traduce la op_key del ledger a concepto y folio legibles.
function describe(opKey) {
  if (opKey.startsWith('recharge:')) return { concepto: 'Recarga de saldo', folio: 'REC' };
  const tx = opKey.match(/^tx(\d+):(debit|credit|compensate)$/);
  if (tx) {
    const ref = `TRX-${tx[1]}`;
    if (tx[2] === 'debit') return { concepto: 'Transferencia enviada', folio: ref };
    if (tx[2] === 'credit') return { concepto: 'Transferencia recibida', folio: ref };
    return { concepto: 'Reverso de transferencia', folio: ref };
  }
  return { concepto: 'Movimiento', folio: '—' };
}

// ── datos del estado de cuenta ───────────────────────────────────────────────
async function getStatement(userId) {
  const [ledger, account] = await Promise.all([
    accountsClient.getLedger(userId).catch(() => []),
    accountsClient.getAccount(userId).catch(() => null),
  ]);

  const movements = ledger.map((r) => {
    const { concepto, folio } = describe(r.op_key);
    return {
      folio,
      concepto,
      kind: r.operation === 'debit' ? 'cargo' : 'abono', // cargo = sale dinero, abono = entra
      amount: r.amount,
      balance: r.new_balance, // saldo corriente tras el movimiento
      created_at: r.created_at,
    };
  });

  const totalReceived = round2(movements.filter((m) => m.kind === 'abono').reduce((a, m) => a + m.amount, 0));
  const totalSent = round2(movements.filter((m) => m.kind === 'cargo').reduce((a, m) => a + m.amount, 0));
  const opening = movements.length ? ledger[0].previous_balance : (account ? Number(account.balance) : 0);
  const closing = movements.length ? ledger[ledger.length - 1].new_balance : (account ? Number(account.balance) : 0);

  const user = account
    ? { id: account.id, name: account.name, email: account.email }
    : { id: Number(userId), name: `Usuario #${userId}`, email: null };

  const stamp = new Date();
  return {
    user,
    folio: `EC-${user.id}-${stamp.getFullYear()}${pad(stamp.getMonth() + 1)}${pad(stamp.getDate())}`,
    generated_at: stamp.toISOString(),
    current_balance: account ? Number(account.balance) : closing,
    opening_balance: round2(opening),
    closing_balance: round2(closing),
    summary: { total_received: totalReceived, total_sent: totalSent, count: movements.length },
    movements,
  };
}

// ── render PDF estilo estado de cuenta bancario ──────────────────────────────
function renderPdf(data, res) {
  const doc = new PDFDocument({ size: 'A4', margin: 0 });
  doc.pipe(res);

  const W = doc.page.width;
  const H = doc.page.height;
  const M = 50;
  const right = W - M;
  const C = { indigo: '#4f46e5', dark: '#111827', muted: '#6b7280', line: '#e5e7eb', red: '#b91c1c', green: '#047857', light: '#f3f4f6', zebra: '#fafafa' };

  // Banda de marca
  doc.rect(0, 0, W, 84).fill(C.indigo);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(20).text('NeoWallet', M, 24);
  doc.font('Helvetica').fontSize(9).fillColor('#e0e7ff').text('Pagos P2P', M, 50);
  doc.font('Helvetica-Bold').fontSize(14).fillColor('#ffffff').text('ESTADO DE CUENTA', M, 24, { width: right - M, align: 'right' });
  doc.font('Helvetica').fontSize(9).fillColor('#e0e7ff')
    .text(`Folio: ${data.folio}`, M, 48, { width: right - M, align: 'right' })
    .text(`Emitido: ${fecha(data.generated_at)}`, M, 60, { width: right - M, align: 'right' });

  // Datos del titular
  let y = 104;
  doc.fillColor(C.muted).font('Helvetica').fontSize(8).text('TITULAR', M, y);
  doc.fillColor(C.dark).font('Helvetica-Bold').fontSize(11).text(data.user.name, M, y + 11);
  doc.fillColor(C.muted).font('Helvetica').fontSize(9)
    .text(`Cuenta No. ${String(data.user.id).padStart(8, '0')}`, M, y + 28);
  if (data.user.email) doc.text(data.user.email, M, y + 40);

  // Tarjetas de resumen
  y = 168;
  const cards = [
    ['Saldo inicial', money(data.opening_balance), C.dark],
    ['Total abonos', '+' + money(data.summary.total_received), C.green],
    ['Total cargos', '-' + money(data.summary.total_sent), C.red],
    ['Saldo final', money(data.closing_balance), C.dark],
  ];
  const gap = 10;
  const cw = (right - M - gap * 3) / 4;
  const ch = 48;
  cards.forEach((c, i) => {
    const x = M + i * (cw + gap);
    doc.roundedRect(x, y, cw, ch, 6).fill(C.light);
    doc.fillColor(C.muted).font('Helvetica').fontSize(8).text(c[0], x + 9, y + 9, { width: cw - 18 });
    doc.fillColor(c[2]).font('Helvetica-Bold').fontSize(12).text(c[1], x + 9, y + 24, { width: cw - 18 });
  });

  // Tabla de movimientos
  y += ch + 22;
  doc.fillColor(C.dark).font('Helvetica-Bold').fontSize(11).text('Detalle de movimientos', M, y);
  y += 18;

  const cols = [
    { label: 'Fecha', x: M, w: 80, align: 'left' },
    { label: 'Folio', x: M + 80, w: 52, align: 'left' },
    { label: 'Concepto', x: M + 132, w: 150, align: 'left' },
    { label: 'Cargo', x: M + 282, w: 70, align: 'right' },
    { label: 'Abono', x: M + 352, w: 70, align: 'right' },
    { label: 'Saldo', x: M + 422, w: right - (M + 422), align: 'right' },
  ];

  function header() {
    doc.rect(M, y, right - M, 20).fill(C.indigo);
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8);
    cols.forEach((c) => doc.text(c.label, c.x + 4, y + 6, { width: c.w - 8, align: c.align }));
    y += 20;
  }
  header();

  if (data.movements.length === 0) {
    doc.fillColor(C.muted).font('Helvetica').fontSize(9).text('Sin movimientos registrados.', M + 4, y + 6);
    y += 22;
  } else {
    data.movements.forEach((m, idx) => {
      if (y > H - 70) { doc.addPage(); y = M; header(); }
      const rh = 18;
      if (idx % 2 === 1) doc.rect(M, y, right - M, rh).fill(C.zebra);
      doc.font('Helvetica').fontSize(8).fillColor(C.dark);
      doc.text(fechaCorta(m.created_at), cols[0].x + 4, y + 5, { width: cols[0].w - 8 });
      doc.text(m.folio, cols[1].x + 4, y + 5, { width: cols[1].w - 8 });
      doc.text(m.concepto, cols[2].x + 4, y + 5, { width: cols[2].w - 8 });
      doc.fillColor(C.red).text(m.kind === 'cargo' ? money(m.amount) : '', cols[3].x + 4, y + 5, { width: cols[3].w - 8, align: 'right' });
      doc.fillColor(C.green).text(m.kind === 'abono' ? money(m.amount) : '', cols[4].x + 4, y + 5, { width: cols[4].w - 8, align: 'right' });
      doc.fillColor(C.dark).text(money(m.balance), cols[5].x + 4, y + 5, { width: cols[5].w - 8, align: 'right' });
      y += rh;
      doc.strokeColor(C.line).lineWidth(0.5).moveTo(M, y).lineTo(right, y).stroke();
    });
  }

  // Pie
  doc.font('Helvetica').fontSize(7).fillColor(C.muted)
    .text('Documento generado automáticamente por NeoWallet. Refleja los movimientos registrados en el sistema. Conserve este comprobante.',
      M, H - 46, { width: right - M, align: 'center' });

  doc.end();
}

module.exports = { getStatement, renderPdf };
