/**
 * Pengguna.js
 * Model MongoDB untuk data pengguna
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Schema untuk Pengguna
const schemaPengguna = new mongoose.Schema({
  namaLengkap: {
    type: String,
    required: [true, 'Nama lengkap wajib diisi'],
    trim: true,
    minlength: [3, 'Nama lengkap minimal 3 karakter']
  },
  email: {
    type: String,
    required: [true, 'Email wajib diisi'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Format email tidak valid']
  },
  password: {
    type: String,
    required: [true, 'Password wajib diisi'],
    minlength: [6, 'Password minimal 6 karakter']
  },
  tanggalDaftar: {
    type: Date,
    default: Date.now
  },
  terakhirLogin: {
    type: Date,
    default: Date.now
  },
  skorTerbaik: {
    type: Number,
    default: 0
  },
  totalPermainan: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true // Otomatis menambahkan createdAt dan updatedAt
});

// Middleware untuk hash password sebelum menyimpan
schemaPengguna.pre('save', async function(next) {
  // Hanya hash password jika password baru atau diubah
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Generate salt dan hash password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method untuk membandingkan password
schemaPengguna.methods.bandingkanPassword = async function(passwordInput) {
  try {
    return await bcrypt.compare(passwordInput, this.password);
  } catch (error) {
    throw new Error('Error membandingkan password');
  }
};

// Method untuk update waktu login terakhir
schemaPengguna.methods.updateLoginTerakhir = async function() {
  this.terakhirLogin = new Date();
  await this.save();
};

// Method untuk menghapus password dari output JSON
schemaPengguna.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const Pengguna = mongoose.model('Pengguna', schemaPengguna);

module.exports = Pengguna;
