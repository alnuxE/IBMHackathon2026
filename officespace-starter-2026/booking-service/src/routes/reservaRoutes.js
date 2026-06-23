const express = require('express');
const router = express.Router();
const reservaController = require('../controllers/reservaController');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const { ROLES } = require('../constants/roles');

// Todas las reservas (solo ADMINISTRADOR) — para la vista/exportación de admin
router.get('/', auth, requireRole(ROLES.ADMINISTRADOR), reservaController.todas);

// Importación masiva desde Excel/CSV (solo ADMINISTRADOR)
router.post('/import', auth, requireRole(ROLES.ADMINISTRADOR), reservaController.importar);

// Espacios ocupados en un rango horario (buscador de disponibilidad)
router.get('/ocupados', auth, reservaController.ocupados);

// Reservas confirmadas de un espacio: requiere usuario autenticado
router.get('/space/:spaceId', auth, reservaController.porEspacio);

// Recalcula estados y sincroniza espacios (cron / disparo manual)
router.post('/sync', auth, reservaController.sync);

// Resto de operaciones
router.post('/', auth, reservaController.create);
router.get('/me', auth, reservaController.misReservas);
router.patch('/:id/cancel', auth, reservaController.cancel);

module.exports = router;
