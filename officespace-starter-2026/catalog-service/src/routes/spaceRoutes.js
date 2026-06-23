const express = require('express');
const router = express.Router();
const spaceController = require('../controllers/spaceController');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const { ROLES } = require('../constants/roles');

// Lectura: requiere usuario autenticado (cualquier rol)
router.get('/', auth, spaceController.list);
router.get('/:id', auth, spaceController.getById);

// Cambio de status: cualquier usuario autenticado (lo usa el flujo de reservas)
router.patch('/:id/status', auth, spaceController.updateStatus);

// Sincroniza las reservas embebidas del espacio (lo usa booking-service)
router.put('/:id/reservas', auth, spaceController.setReservas);

// Escritura: requiere JWT válido y rol ADMINISTRADOR
router.post('/', auth, requireRole(ROLES.ADMINISTRADOR), spaceController.create);
router.put('/:id', auth, requireRole(ROLES.ADMINISTRADOR), spaceController.update);
router.delete('/:id', auth, requireRole(ROLES.ADMINISTRADOR), spaceController.remove);

module.exports = router;
