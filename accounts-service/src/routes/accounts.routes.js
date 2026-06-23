const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/accounts.controller');

// Lista de usuarios (para el frontend — no hay registro/login)
router.get('/accounts', ctrl.listAccounts);

// RF-001 · Consultar saldo de un usuario
router.get('/accounts/:userId', ctrl.getAccount);

// RF-002 · Recargar saldo (simulado)
router.post('/api/recharge', ctrl.recharge);

// RF-004 · Actualizar balance (endpoint INTERNO, lo usa processor-service)
router.post('/accounts/update-balance', ctrl.updateBalance);

module.exports = router;
