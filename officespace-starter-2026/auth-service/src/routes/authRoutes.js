const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST /auth/login  (no hay registro: los usuarios se cargan desde el seeder)
router.post('/login', authController.login);

module.exports = router;
