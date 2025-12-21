/**
 * penggunaRoute.js
 * Routes untuk autentikasi dan manajemen pengguna
 */

const express = require('express');
const rute = express.Router();

// Import controller
const penggunaController = require('../controllers/penggunaController');

// ==================== AUTENTIKASI ROUTES ====================

// Registrasi pengguna baru
rute.post('/register', penggunaController.registerPengguna);

// Login pengguna
rute.post('/login', penggunaController.loginPengguna);

// Logout pengguna
rute.get('/logout', penggunaController.logoutPengguna);

// Cek status login
rute.get('/cek-login', penggunaController.cekStatusLogin);

// ==================== PROFIL ROUTES ====================

// Dapatkan profil pengguna
rute.get('/profil', penggunaController.dapatkanProfil);

// Dapatkan riwayat skor pengguna
rute.get('/riwayat-skor', penggunaController.dapatkanRiwayatSkor);

// Debug route: jumlah riwayat skor (cek session & collection)
rute.get('/debug-riwayat', penggunaController.debugRiwayat);

module.exports = rute;
