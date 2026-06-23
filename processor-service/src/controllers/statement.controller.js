// Controlador de estados de cuenta / facturación.
const service = require('../services/statement.service');

function parseId(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

// Verifica id válido y que sea el propio usuario. Devuelve el id o null (ya respondió).
function ownUserOr403(req, res) {
  const id = parseId(req.params.userId);
  if (id === null) { res.status(400).json({ error: 'invalid_id' }); return null; }
  if (id !== req.userId) { res.status(403).json({ error: 'forbidden' }); return null; }
  return id;
}

// GET /api/statements/:userId  → estado de cuenta en JSON
async function getStatement(req, res, next) {
  try {
    const id = ownUserOr403(req, res);
    if (id === null) return;
    res.json(await service.getStatement(id));
  } catch (err) {
    next(err);
  }
}

// GET /api/statements/:userId/pdf  → estado de cuenta en PDF (descarga)
async function getStatementPdf(req, res, next) {
  try {
    const id = ownUserOr403(req, res);
    if (id === null) return;

    const data = await service.getStatement(id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="estado-cuenta-${id}.pdf"`);
    service.renderPdf(data, res); // hace el pipe al response y cierra el documento
  } catch (err) {
    next(err);
  }
}

module.exports = { getStatement, getStatementPdf };
