/**
 * validasiSudoku.js
 * Utility untuk memvalidasi papan Sudoku
 */

/**
 * Cek apakah angka valid di posisi tertentu
 * @param {Array} papan - Papan Sudoku 9x9
 * @param {Number} baris - Index baris (0-8)
 * @param {Number} kolom - Index kolom (0-8)
 * @param {Number} angka - Angka yang akan dicek (1-9)
 * @returns {Boolean} True jika valid, false jika tidak
 */
const apakahAngkaValid = (papan, baris, kolom, angka) => {
  // Validasi input
  if (angka < 1 || angka > 9) return false;
  if (baris < 0 || baris > 8) return false;
  if (kolom < 0 || kolom > 8) return false;

  // Cek baris - tidak boleh ada duplikat di baris yang sama
  for (let k = 0; k < 9; k++) {
    if (k !== kolom && papan[baris][k] === angka) {
      return false;
    }
  }

  // Cek kolom - tidak boleh ada duplikat di kolom yang sama
  for (let b = 0; b < 9; b++) {
    if (b !== baris && papan[b][kolom] === angka) {
      return false;
    }
  }

  // Cek subgrid 3x3 - tidak boleh ada duplikat di kotak 3x3 yang sama
  const barisMulai = Math.floor(baris / 3) * 3;
  const kolomMulai = Math.floor(kolom / 3) * 3;

  for (let b = barisMulai; b < barisMulai + 3; b++) {
    for (let k = kolomMulai; k < kolomMulai + 3; k++) {
      if ((b !== baris || k !== kolom) && papan[b][k] === angka) {
        return false;
      }
    }
  }

  return true;
};

/**
 * Validasi apakah papan sudoku sudah terisi dengan benar
 * @param {Array} papan - Papan Sudoku 9x9
 * @returns {Boolean} True jika valid dan lengkap
 */
const validasiPapanLengkap = (papan) => {
  // Cek apakah papan valid (9x9)
  if (!papan || papan.length !== 9) {
    return false;
  }

  for (let baris = 0; baris < 9; baris++) {
    if (!papan[baris] || papan[baris].length !== 9) {
      return false;
    }

    for (let kolom = 0; kolom < 9; kolom++) {
      const angka = papan[baris][kolom];

      // Cek apakah sel kosong
      if (angka === 0 || angka === null) {
        return false;
      }

      // Cek apakah angka valid (1-9)
      if (angka < 1 || angka > 9) {
        return false;
      }

      // Simpan angka sementara dan cek validitas
      const temp = papan[baris][kolom];
      papan[baris][kolom] = 0;

      if (!apakahAngkaValid(papan, baris, kolom, temp)) {
        papan[baris][kolom] = temp;
        return false;
      }

      papan[baris][kolom] = temp;
    }
  }

  return true;
};

/**
 * Cek apakah papan sudoku masih memiliki sel kosong
 * @param {Array} papan - Papan Sudoku 9x9
 * @returns {Boolean} True jika masih ada sel kosong
 */
const adaSelKosong = (papan) => {
  for (let baris = 0; baris < 9; baris++) {
    for (let kolom = 0; kolom < 9; kolom++) {
      if (papan[baris][kolom] === 0) {
        return true;
      }
    }
  }
  return false;
};

/**
 * Bandingkan dua papan sudoku
 * @param {Array} papan1 - Papan Sudoku pertama
 * @param {Array} papan2 - Papan Sudoku kedua
 * @returns {Boolean} True jika identik
 */
const bandingkanPapan = (papan1, papan2) => {
  if (!papan1 || !papan2) return false;
  if (papan1.length !== 9 || papan2.length !== 9) return false;

  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      if (papan1[i][j] !== papan2[i][j]) {
        return false;
      }
    }
  }

  return true;
};

module.exports = {
  apakahAngkaValid,
  validasiPapanLengkap,
  adaSelKosong,
  bandingkanPapan
};
