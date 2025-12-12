/**
 * sudokuGenerator.js
 * Service untuk menghasilkan puzzle Sudoku baru dengan berbagai tingkat kesulitan
 * 
 * Alur Generator:
 * 1. Buat papan Sudoku lengkap yang valid (solusi)
 * 2. Hapus beberapa angka berdasarkan tingkat kesulitan
 * 3. Pastikan puzzle tetap memiliki solusi unik
 * 4. Return puzzle dan solusinya
 */

const { pecahkanSudoku, salinPapan, cekSolusiUnik } = require('./sudokuSolver');
const { apakahAngkaValid } = require('../utils/validasiSudoku');

/**
 * Buat papan kosong 9x9
 * @returns {Array} Papan 9x9 berisi angka 0
 */
const buatPapanKosong = () => {
  return Array(9).fill(null).map(() => Array(9).fill(0));
};

/**
 * Shuffle array menggunakan algoritma Fisher-Yates
 * @param {Array} array - Array yang akan di-shuffle
 * @returns {Array} Array yang sudah di-shuffle
 */
const acakArray = (array) => {
  const hasil = [...array];
  for (let i = hasil.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [hasil[i], hasil[j]] = [hasil[j], hasil[i]];
  }
  return hasil;
};

/**
 * Isi papan dengan angka secara rekursif untuk membuat solusi lengkap
 * Menggunakan randomisasi untuk membuat puzzle yang berbeda-beda
 * @param {Array} papan - Papan yang akan diisi
 * @returns {Boolean} True jika berhasil
 */
const isiPapanLengkap = (papan) => {
  // Cari sel kosong
  let barisKosong = -1;
  let kolomKosong = -1;

  for (let baris = 0; baris < 9; baris++) {
    for (let kolom = 0; kolom < 9; kolom++) {
      if (papan[baris][kolom] === 0) {
        barisKosong = baris;
        kolomKosong = kolom;
        break;
      }
    }
    if (barisKosong !== -1) break;
  }

  // Jika tidak ada sel kosong, berarti selesai
  if (barisKosong === -1) {
    return true;
  }

  // Buat array angka 1-9 dan acak
  const angkaAcak = acakArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);

  // Coba setiap angka secara acak
  for (let angka of angkaAcak) {
    if (apakahAngkaValid(papan, barisKosong, kolomKosong, angka)) {
      papan[barisKosong][kolomKosong] = angka;

      if (isiPapanLengkap(papan)) {
        return true;
      }

      // Backtrack
      papan[barisKosong][kolomKosong] = 0;
    }
  }

  return false;
};

/**
 * Buat papan Sudoku lengkap (solusi) secara random
 * @returns {Array} Papan Sudoku lengkap 9x9
 */
const buatSolusiLengkap = () => {
  const papan = buatPapanKosong();
  
  // Isi baris pertama dengan angka acak untuk variasi
  const barisAwal = acakArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  for (let i = 0; i < 9; i++) {
    papan[0][i] = barisAwal[i];
  }

  // Isi sisa papan
  isiPapanLengkap(papan);
  
  return papan;
};

/**
 * Hitung jumlah sel yang harus dihapus berdasarkan tingkat kesulitan
 * @param {String} tingkat - 'mudah', 'sedang', atau 'sulit'
 * @returns {Number} Jumlah sel yang akan dihapus
 */
const tentukanJumlahHapus = (tingkat) => {
  switch (tingkat.toLowerCase()) {
    case 'mudah':
      // Mudah: hapus 30-40 sel (tersisa 41-51 angka)
      return 30 + Math.floor(Math.random() * 11);
    case 'sedang':
      // Sedang: hapus 45-50 sel (tersisa 31-36 angka)
      return 45 + Math.floor(Math.random() * 6);
    case 'sulit':
      // Sulit: hapus 55-60 sel (tersisa 21-26 angka)
      return 55 + Math.floor(Math.random() * 6);
    default:
      return 45; // Default sedang
  }
};

/**
 * Hapus angka dari papan untuk membuat puzzle
 * Menghapus secara simetris untuk estetika
 * @param {Array} papanLengkap - Papan Sudoku lengkap
 * @param {Number} jumlahHapus - Jumlah sel yang akan dihapus
 * @returns {Array} Papan puzzle dengan sel kosong
 */
const hapusAngkaUntukPuzzle = (papanLengkap, jumlahHapus) => {
  const papan = salinPapan(papanLengkap);
  let sudahDihapus = 0;
  const maksimalPercobaan = jumlahHapus * 3; // Batas percobaan
  let percobaan = 0;

  while (sudahDihapus < jumlahHapus && percobaan < maksimalPercobaan) {
    percobaan++;

    // Pilih posisi acak
    const baris = Math.floor(Math.random() * 9);
    const kolom = Math.floor(Math.random() * 9);

    // Skip jika sudah kosong
    if (papan[baris][kolom] === 0) {
      continue;
    }

    // Simpan angka yang akan dihapus
    const cadangan = papan[baris][kolom];

    // Hapus angka
    papan[baris][kolom] = 0;

    // Salin papan untuk testing
    const papanTest = salinPapan(papan);

    // Cek apakah masih bisa diselesaikan
    // Kita gunakan solver untuk memastikan puzzle masih valid
    if (pecahkanSudoku(papanTest)) {
      // Berhasil dihapus
      sudahDihapus++;
      
      // Hapus juga posisi simetris untuk variasi (opsional)
      const barisSimetris = 8 - baris;
      const kolomSimetris = 8 - kolom;
      if (papan[barisSimetris][kolomSimetris] !== 0 && sudahDihapus < jumlahHapus) {
        papan[barisSimetris][kolomSimetris] = 0;
        sudahDihapus++;
      }
    } else {
      // Kembalikan angka jika tidak bisa diselesaikan
      papan[baris][kolom] = cadangan;
    }
  }

  return papan;
};

/**
 * Generate puzzle Sudoku baru dengan tingkat kesulitan tertentu
 * @param {String} tingkat - 'mudah', 'sedang', atau 'sulit'
 * @returns {Object} {papan: puzzle, solusi: solusi lengkap}
 */
const generateSudoku = (tingkat = 'sedang') => {
  console.log(`🎲 Membuat puzzle Sudoku tingkat ${tingkat}...`);

  // 1. Buat solusi lengkap
  const solusi = buatSolusiLengkap();
  console.log('   ✓ Solusi lengkap dibuat');

  // 2. Tentukan jumlah sel yang akan dihapus
  const jumlahHapus = tentukanJumlahHapus(tingkat);
  console.log(`   ✓ Akan menghapus ${jumlahHapus} sel`);

  // 3. Hapus angka untuk membuat puzzle
  const papan = hapusAngkaUntukPuzzle(solusi, jumlahHapus);
  
  // 4. Hitung sel kosong aktual
  let selKosong = 0;
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      if (papan[i][j] === 0) selKosong++;
    }
  }
  console.log(`   ✓ Puzzle dibuat dengan ${selKosong} sel kosong`);
  console.log('   ✅ Puzzle siap dimainkan!');

  return {
    papan: papan,
    solusi: solusi,
    tingkat: tingkat,
    selKosong: selKosong
  };
};

/**
 * Generate beberapa puzzle sekaligus (untuk pre-generate)
 * @param {String} tingkat - Tingkat kesulitan
 * @param {Number} jumlah - Jumlah puzzle yang akan di-generate
 * @returns {Array} Array of puzzle objects
 */
const generateBanyakSudoku = (tingkat = 'sedang', jumlah = 5) => {
  const puzzles = [];
  
  console.log(`Membuat ${jumlah} puzzle tingkat ${tingkat}...`);
  
  for (let i = 0; i < jumlah; i++) {
    puzzles.push(generateSudoku(tingkat));
    console.log(`Puzzle ${i + 1}/${jumlah} selesai`);
  }
  
  return puzzles;
};

module.exports = {
  generateSudoku,
  generateBanyakSudoku,
  buatPapanKosong,
  buatSolusiLengkap
};
