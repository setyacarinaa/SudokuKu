/**
 * apiRoute.js
 * Routes untuk API Sudoku, Skor, dan Leaderboard
 */

const express = require('express');
const rute = express.Router();

// Import controllers
const sudokuController = require('../controllers/sudokuController');
const apiController = require('../controllers/apiController');
// emailController removed; email testing routes handled via appController or removed
const appController = require('../controllers/appController');

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

// Test endpoint leaderboard
rute.get('/test-leaderboard', async (req, res) => {
  try {
    const Skor = require('../models/Skor');
    const mongoose = require('mongoose');
    
    const dbStatus = mongoose.connection.readyState;
    const totalDocs = dbStatus === 1 ? await Skor.countDocuments({}) : 0;
    const selesaiDocs = dbStatus === 1 ? await Skor.countDocuments({ apakahSelesai: true }) : 0;
    
    res.json({
      sukses: true,
      pesan: 'Test endpoint berfungsi!',
      dbStatus: dbStatus === 1 ? 'Connected' : 'Disconnected',
      totalDocuments: totalDocs,
      selesaiDocuments: selesaiDocs
    });
  } catch (error) {
    res.json({
      sukses: false,
      error: error.message
    });
  }
});

// Dapatkan statistik pengguna
rute.get('/statistik', apiController.dapatkanStatistik);

// ==================== AUTH / REGISTRATION ====================
// Register user (kirim welcome email hanya setelah berhasil registrasi)
rute.post('/auth/register', appController.registerUser);

module.exports = rute;
