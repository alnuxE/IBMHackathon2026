const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/processor.controller');

// RF-003 · Transferir dinero entre usuarios (P2P)
router.post('/api/transfer', ctrl.transfer);

// RF-005 · Historial de transacciones de un usuario (BONUS)
router.get('/api/transactions/:userId', ctrl.getTransactions);

module.exports = router;
