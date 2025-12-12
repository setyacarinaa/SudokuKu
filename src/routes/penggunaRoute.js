/**
 * penggunaRoute.js
 * Routes untuk autentikasi dan manajemen pengguna
 */

const express = require('express');
const router = express.Router();

// Import controller
const penggunaController = require('../controllers/penggunaController');

// ==================== AUTENTIKASI ROUTES ====================

// Registrasi pengguna baru
router.post('/register', penggunaController.registerPengguna);

// Login pengguna
router.post('/login', penggunaController.loginPengguna);

// Logout pengguna
router.get('/logout', penggunaController.logoutPengguna);

// Cek status login
router.get('/cek-login', penggunaController.cekStatusLogin);

// ==================== PROFIL ROUTES ====================

// Dapatkan profil pengguna
router.get('/profil', penggunaController.dapatkanProfil);

module.exports = router;
