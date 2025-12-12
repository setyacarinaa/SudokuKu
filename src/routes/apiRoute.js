/**
 * apiRoute.js
 * Routes untuk API Sudoku, Skor, dan Leaderboard
 */

const express = require('express');
const router = express.Router();

// Import controllers
const sudokuController = require('../controllers/sudokuController');
const apiController = require('../controllers/apiController');
const emailController = require('../controllers/emailController');

// ==================== SUDOKU ROUTES ====================

// Dapatkan papan Sudoku baru
router.get('/papan', sudokuController.dapatkanPapanBaru);

// Selesaikan puzzle (untuk testing)
router.post('/selesaikan', sudokuController.selesaikanPuzzle);

// Dapatkan solusi puzzle aktif
router.get('/solusi', sudokuController.dapatkanSolusi);

// ==================== SKOR & LEADERBOARD ROUTES ====================

// Rekam skor permainan
router.post('/rekam-skor', apiController.rekamSkor);

// Dapatkan leaderboard
router.get('/leaderboard', apiController.dapatkanLeaderboard);

// Dapatkan statistik pengguna
router.get('/statistik', apiController.dapatkanStatistik);

// ==================== EMAIL TESTING ROUTES ====================

// Test koneksi email
router.get('/test-email', emailController.testEmail);

// Kirim email test
router.post('/kirim-email-test', emailController.kirimEmailTest);

module.exports = router;
