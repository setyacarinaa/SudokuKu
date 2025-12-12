/**
 * apiRoute.js
 * Routes untuk API Sudoku, Skor, dan Leaderboard
 */

const express = require('express');
const rute = express.Router();

// Import controllers
const sudokuController = require('../controllers/sudokuController');
const apiController = require('../controllers/apiController');
const emailController = require('../controllers/emailController');

// ==================== SUDOKU ROUTES ====================

// Dapatkan papan Sudoku baru
rute.get('/papan', sudokuController.dapatkanPapanBaru);

// Selesaikan puzzle (untuk testing)
rute.post('/selesaikan', sudokuController.selesaikanPuzzle);

// Dapatkan solusi puzzle aktif
rute.get('/solusi', sudokuController.dapatkanSolusi);

// ==================== SKOR & LEADERBOARD ROUTES ====================

// Rekam skor permainan
rute.post('/rekam-skor', apiController.rekamSkor);

// Dapatkan leaderboard
rute.get('/leaderboard', apiController.dapatkanLeaderboard);

// Dapatkan statistik pengguna
rute.get('/statistik', apiController.dapatkanStatistik);

// ==================== EMAIL TESTING ROUTES ====================

// Test koneksi email
rute.get('/test-email', emailController.testEmail);

// Kirim email test
rute.post('/kirim-email-test', emailController.kirimEmailTest);

module.exports = rute;
