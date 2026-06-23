const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/processor.controller');
const { requireUser } = require('../middlewares/auth.middleware');

// RF-003 · Transferir dinero (P2P). El sender es SIEMPRE el usuario del token.
router.post('/api/transfer', requireUser, ctrl.transfer);

// RF-005 · Historial de transacciones (BONUS). Solo el propio historial.
router.get('/api/transactions/:userId', requireUser, ctrl.getTransactions);

module.exports = router;
