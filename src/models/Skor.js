/**
 * Skor.js
 * Model MongoDB untuk data skor permainan Sudoku
 */

const mongoose = require('mongoose');

// Schema untuk Skor
const schemaSkor = new mongoose.Schema({
  idPengguna: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pengguna',
    required: true
  },
  namaPengguna: {
    type: String,
    required: true
  },
  tingkatKesulitan: {
    type: String,
    enum: ['mudah', 'sedang', 'sulit'],
    required: true
  },
  waktuPenyelesaian: {
    type: Number, // dalam detik
    required: true
  },
  skor: {
    type: Number,
    required: true
  },
  tanggalMain: {
    type: Date,
    default: Date.now
  },
  apakahSelesai: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index untuk performa query leaderboard
schemaSkor.index({ skor: -1 });
schemaSkor.index({ tingkatKesulitan: 1, skor: -1 });
schemaSkor.index({ idPengguna: 1, tanggalMain: -1 });

// Method untuk menghitung skor berdasarkan waktu dan tingkat kesulitan
schemaSkor.statics.hitungSkor = function(waktuDetik, tingkat) {
  // Base score berdasarkan tingkat
  const baseScore = {
    'mudah': 100,
    'sedang': 200,
    'sulit': 300
  };

  // Bonus berdasarkan kecepatan
  // Semakin cepat, semakin tinggi bonus
  const bonusKecepatan = Math.max(0, 500 - waktuDetik);

  const skorTotal = (baseScore[tingkat] || 100) + bonusKecepatan;
  return Math.round(skorTotal);
};

const Skor = mongoose.model('Skor', schemaSkor);

module.exports = Skor;
