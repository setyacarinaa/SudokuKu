/**
 * sudokuSolver.js
 * Service untuk menyelesaikan puzzle Sudoku menggunakan algoritma Backtracking
 * 
 * Algoritma Backtracking:
 * 1. Cari sel kosong (bernilai 0)
 * 2. Coba angka 1-9 di sel tersebut
 * 3. Cek apakah angka valid (tidak melanggar aturan Sudoku)
 * 4. Jika valid, lanjutkan ke sel kosong berikutnya (rekursi)
 * 5. Jika tidak bisa diselesaikan, mundur (backtrack) dan coba angka lain
 * 6. Ulangi hingga semua sel terisi atau tidak ada solusi
 */

const { apakahAngkaValid } = require('../utils/validasiSudoku');

/**
 * Fungsi untuk mencari sel kosong pertama di papan
 * @param {Array} papan - Papan Sudoku 9x9
 * @returns {Object|null} {baris, kolom} dari sel kosong, atau null jika tidak ada
 */
const cariSelKosong = (papan) => {
  for (let baris = 0; baris < 9; baris++) {
    for (let kolom = 0; kolom < 9; kolom++) {
      // Sel kosong ditandai dengan angka 0
      if (papan[baris][kolom] === 0) {
        return { baris, kolom };
      }
    }
  }
  // Tidak ada sel kosong, berarti papan sudah lengkap
  return null;
};

/**
 * Fungsi untuk menyalin papan (deep copy)
 * Penting untuk menghindari mutasi papan asli
 * @param {Array} papan - Papan Sudoku yang akan disalin
 * @returns {Array} Salinan papan
 */
const salinPapan = (papan) => {
  return papan.map(baris => [...baris]);
};

/**
 * Fungsi rekursif untuk menyelesaikan Sudoku dengan Backtracking
 * @param {Array} papan - Papan Sudoku 9x9 yang akan diselesaikan
 * @returns {Boolean} True jika berhasil diselesaikan, false jika tidak ada solusi
 */
const pecahkanSudoku = (papan) => {
  // Cari sel kosong
  const selKosong = cariSelKosong(papan);

  // Jika tidak ada sel kosong, berarti puzzle sudah selesai
  if (!selKosong) {
    return true;
  }

  const { baris, kolom } = selKosong;

  // Coba angka 1 sampai 9
  for (let angka = 1; angka <= 9; angka++) {
    // Cek apakah angka ini valid di posisi ini
    if (apakahAngkaValid(papan, baris, kolom, angka)) {
      // Jika valid, masukkan angka ke papan
      papan[baris][kolom] = angka;

      // Rekursi: coba selesaikan sisa papan
      if (pecahkanSudoku(papan)) {
        // Jika berhasil, return true
        return true;
      }

      // Jika tidak berhasil, backtrack: kembalikan sel ke 0
      papan[baris][kolom] = 0;
    }
  }

  // Jika semua angka 1-9 tidak berhasil, return false (backtrack)
  return false;
};

/**
 * Fungsi wrapper untuk menyelesaikan Sudoku
 * Membuat salinan papan agar tidak mengubah papan asli
 * @param {Array} papanAsli - Papan Sudoku asli
 * @returns {Array|null} Papan solusi jika berhasil, null jika tidak ada solusi
 */
const selesaikanSudoku = (papanAsli) => {
  // Validasi input
  if (!papanAsli || papanAsli.length !== 9) {
    console.error('Error: Papan tidak valid (harus 9x9)');
    return null;
  }

  // Validasi setiap baris
  for (let i = 0; i < 9; i++) {
    if (!papanAsli[i] || papanAsli[i].length !== 9) {
      console.error(`Error: Baris ${i} tidak valid (harus berisi 9 kolom)`);
      return null;
    }
  }

  // Salin papan agar tidak mengubah yang asli
  const papanSalinan = salinPapan(papanAsli);

  // Coba selesaikan puzzle
  const berhasil = pecahkanSudoku(papanSalinan);

  if (berhasil) {
    console.log('✅ Sudoku berhasil diselesaikan!');
    return papanSalinan;
  } else {
    console.error('❌ Sudoku tidak memiliki solusi!');
    return null;
  }
};

/**
 * Fungsi untuk mengecek apakah puzzle memiliki solusi unik
 * @param {Array} papan - Papan Sudoku
 * @returns {Boolean} True jika solusi unik
 */
const cekSolusiUnik = (papan) => {
  const solusi = [];
  const papanSalinan = salinPapan(papan);

  const cariSemuaSolusi = (papanTemp, maxSolusi = 2) => {
    if (solusi.length >= maxSolusi) return;

    const selKosong = cariSelKosong(papanTemp);
    if (!selKosong) {
      solusi.push(salinPapan(papanTemp));
      return;
    }

    const { baris, kolom } = selKosong;

    for (let angka = 1; angka <= 9; angka++) {
      if (apakahAngkaValid(papanTemp, baris, kolom, angka)) {
        papanTemp[baris][kolom] = angka;
        cariSemuaSolusi(papanTemp, maxSolusi);
        papanTemp[baris][kolom] = 0;
      }
    }
  };

  cariSemuaSolusi(papanSalinan);
  return solusi.length === 1;
};

module.exports = {
  selesaikanSudoku,
  pecahkanSudoku,
  cariSelKosong,
  salinPapan,
  cekSolusiUnik
};
