const express = require('express');
const router = express.Router();
const recursoController = require('../controllers/recursoController');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const { ROLES } = require('../constants/roles');

// Lectura: requiere usuario autenticado (cualquier rol)
router.get('/', auth, recursoController.list);
router.get('/:id', auth, recursoController.getById);

// Escritura: solo ADMINISTRADOR (gestiona el catálogo de recursos)
router.post('/', auth, requireRole(ROLES.ADMINISTRADOR), recursoController.create);
router.put('/:id', auth, requireRole(ROLES.ADMINISTRADOR), recursoController.update);
router.delete('/:id', auth, requireRole(ROLES.ADMINISTRADOR), recursoController.remove);

module.exports = router;
