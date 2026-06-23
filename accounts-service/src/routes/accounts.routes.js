const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/accounts.controller');
const auth = require('../controllers/auth.controller');
const { requireUser, authenticate, requireInternal } = require('../middlewares/auth.middleware');

// ── Autenticación ───────────────────────────────────────────────────────────
// Login con email + contraseña → devuelve un JWT
router.post('/auth/login', auth.login);
// Datos del usuario logueado (valida el token)
router.get('/auth/me', requireUser, auth.me);

// ── Cuentas (protegidas) ──────────────────────────────────────────────────────
// Directorio de usuarios (sin saldos) — para elegir destinatario en transferencias
router.get('/accounts', requireUser, ctrl.listAccounts);

// RF-001 · Consultar saldo. Un usuario solo ve su propia cuenta;
// el processor-service (interno) puede consultar cualquiera.
router.get('/accounts/:userId', authenticate, ctrl.getAccount);

// RF-002 · Recargar saldo (siempre sobre la cuenta del usuario autenticado)
router.post('/api/recharge', requireUser, ctrl.recharge);

// RF-004 · Actualizar balance (endpoint INTERNO: solo el processor-service)
router.post('/accounts/update-balance', requireInternal, ctrl.updateBalance);

module.exports = router;
