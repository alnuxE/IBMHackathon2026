// Estado de cuenta (estado de cuenta / facturación) de un usuario.
//
// Un estado de cuenta es un DOCUMENTO FINANCIERO: se construye desde la fuente de
// verdad (transacciones liquidadas + saldo actual del accounts-service), no desde
// el cliente. Solo incluye transferencias COMPLETED (movimientos liquidados).

const PDFDocument = require('pdfkit');
const { query } = require('../config/db');
const accountsClient = require('../clients/accounts.client');

// Reúne los datos del estado de cuenta del usuario.
async function getStatement(userId) {
  const { rows } = await query(
    `SELECT id, sender_id, receiver_id, amount, status, created_at
     FROM transactions
     WHERE (sender_id = $1 OR receiver_id = $1) AND status = 'COMPLETED'
     ORDER BY created_at DESC, id DESC`,
    [userId]
  );

  const movements = rows.map((t) => {
    const sent = t.sender_id === Number(userId);
    return {
      id: t.id,
      type: sent ? 'sent' : 'received',
      counterparty_id: sent ? t.receiver_id : t.sender_id,
      amount: Number(t.amount),
      status: t.status,
      created_at: t.created_at,
    };
  });

  const totalSent = movements.filter((m) => m.type === 'sent').reduce((a, m) => a + m.amount, 0);
  const totalReceived = movements.filter((m) => m.type === 'received').reduce((a, m) => a + m.amount, 0);

  // Datos del titular (nombre, email, saldo actual) vía accounts-service (interno).
  let account = null;
  try {
    account = await accountsClient.getAccount(userId);
  } catch {
    account = null; // si accounts no responde, el estado se emite sin cabecera de saldo
  }

  return {
    user: account
      ? { id: account.id, name: account.name, email: account.email }
      : { id: Number(userId), name: `Usuario #${userId}`, email: null },
    generated_at: new Date().toISOString(),
    current_balance: account ? Number(account.balance) : null,
    summary: {
      total_sent: Math.round(totalSent * 100) / 100,
      total_received: Math.round(totalReceived * 100) / 100,
      count: movements.length,
    },
    movements,
  };
}

// Renderiza el estado de cuenta como PDF y lo escribe en el stream `res`.
function renderPdf(data, res) {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  doc.pipe(res);

  const money = (n) => (n == null ? '—' : `$${Number(n).toFixed(2)}`);
  const fecha = (v) => new Date(v).toLocaleString('es-MX');

  // Cabecera
  doc.fontSize(20).fillColor('#111').text('NeoWallet', { continued: false });
  doc.fontSize(12).fillColor('#555').text('Estado de cuenta');
  doc.moveDown(0.5);
  doc.fontSize(10).fillColor('#333')
    .text(`Titular: ${data.user.name}${data.user.email ? ' · ' + data.user.email : ''}`)
    .text(`Cuenta: #${data.user.id}`)
    .text(`Generado: ${fecha(data.generated_at)}`)
    .text(`Saldo actual: ${money(data.current_balance)}`);
  doc.moveDown(0.5);

  // Resumen
  doc.fontSize(11).fillColor('#111').text('Resumen', { underline: true });
  doc.fontSize(10).fillColor('#333')
    .text(`Movimientos liquidados: ${data.summary.count}`)
    .text(`Total recibido: ${money(data.summary.total_received)}`)
    .text(`Total enviado: ${money(data.summary.total_sent)}`);
  doc.moveDown(0.5);

  // Detalle de movimientos
  doc.fontSize(11).fillColor('#111').text('Movimientos', { underline: true });
  doc.moveDown(0.3);

  if (data.movements.length === 0) {
    doc.fontSize(10).fillColor('#777').text('Sin movimientos liquidados.');
  } else {
    doc.fontSize(9).fillColor('#000');
    data.movements.forEach((m) => {
      const signo = m.type === 'sent' ? '-' : '+';
      const etiqueta = m.type === 'sent' ? `Enviado a #${m.counterparty_id}` : `Recibido de #${m.counterparty_id}`;
      doc.text(`#${m.id}  ${fecha(m.created_at)}   ${etiqueta}   ${signo}${money(m.amount)}`);
    });
  }

  doc.moveDown(1);
  doc.fontSize(8).fillColor('#999')
    .text('Documento generado automáticamente por NeoWallet. Conserve este comprobante.', { align: 'center' });

  doc.end();
}

module.exports = { getStatement, renderPdf };
