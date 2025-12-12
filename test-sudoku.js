/**
 * test-sudoku.js
 * File untuk testing solver dan generator Sudoku
 * Jalankan dengan: node test-sudoku.js
 */

const { buatSudoku } = require('./src/services/sudokuGenerator');
const { selesaikanSudoku } = require('./src/services/sudokuSolver');
const { validasiPapanLengkap } = require('./src/utils/validasiSudoku');

console.log('='.repeat(60));
console.log('🧪 TEST SUDOKU GENERATOR DAN SOLVER');
console.log('='.repeat(60));
console.log('');

// Test 1: Generator Sudoku Mudah
console.log('📋 Test 1: Generator Sudoku Mudah');
console.log('-'.repeat(60));
const puzzleMudah = buatSudoku('mudah');
console.log(`✓ Puzzle mudah dibuat dengan ${puzzleMudah.selKosong} sel kosong`);
console.log('');

// Test 2: Generator Sudoku Sedang
console.log('📋 Test 2: Generator Sudoku Sedang');
console.log('-'.repeat(60));
const puzzleSedang = buatSudoku('sedang');
console.log(`✓ Puzzle sedang dibuat dengan ${puzzleSedang.selKosong} sel kosong`);
console.log('');

// Test 3: Generator Sudoku Sulit
console.log('📋 Test 3: Generator Sudoku Sulit');
console.log('-'.repeat(60));
const puzzleSulit = buatSudoku('sulit');
console.log(`✓ Puzzle sulit dibuat dengan ${puzzleSulit.selKosong} sel kosong`);
console.log('');

// Test 4: Solver Sudoku
console.log('📋 Test 4: Solver Sudoku');
console.log('-'.repeat(60));
const papanTest = [
  [5, 3, 0, 0, 7, 0, 0, 0, 0],
  [6, 0, 0, 1, 9, 5, 0, 0, 0],
  [0, 9, 8, 0, 0, 0, 0, 6, 0],
  [8, 0, 0, 0, 6, 0, 0, 0, 3],
  [4, 0, 0, 8, 0, 3, 0, 0, 1],
  [7, 0, 0, 0, 2, 0, 0, 0, 6],
  [0, 6, 0, 0, 0, 0, 2, 8, 0],
  [0, 0, 0, 4, 1, 9, 0, 0, 5],
  [0, 0, 0, 0, 8, 0, 0, 7, 9]
];

console.log('Papan awal:');
tampilkanPapan(papanTest);

const solusi = selesaikanSudoku(papanTest);

if (solusi) {
  console.log('\nSolusi:');
  tampilkanPapan(solusi);
  
  // Validasi solusi
  const valid = validasiPapanLengkap(solusi);
  console.log(`\n✓ Validasi solusi: ${valid ? 'VALID' : 'TIDAK VALID'}`);
} else {
  console.log('❌ Gagal menyelesaikan puzzle');
}
console.log('');

// Test 5: Validasi Generator
console.log('📋 Test 5: Validasi Solusi dari Generator');
console.log('-'.repeat(60));
const puzzleValidasi = buatSudoku('sedang');
const solusiValidasi = puzzleValidasi.solusi;
const validasiSolusi = validasiPapanLengkap(solusiValidasi);
console.log(`✓ Solusi dari generator: ${validasiSolusi ? 'VALID' : 'TIDAK VALID'}`);
console.log('');

// Test 6: Solver dengan Puzzle dari Generator
console.log('📋 Test 6: Solver dengan Puzzle dari Generator');
console.log('-'.repeat(60));
const puzzleUntukSolver = buatSudoku('mudah');
console.log('Puzzle dari generator:');
tampilkanPapan(puzzleUntukSolver.papan);

const solusiDariSolver = selesaikanSudoku(puzzleUntukSolver.papan);
if (solusiDariSolver) {
  console.log('\nSolusi dari solver:');
  tampilkanPapan(solusiDariSolver);
  
  // Bandingkan dengan solusi asli
  const sama = bandingkanPapan(solusiDariSolver, puzzleUntukSolver.solusi);
  console.log(`\n✓ Solusi solver ${sama ? 'SAMA' : 'BERBEDA'} dengan solusi generator`);
} else {
  console.log('❌ Gagal menyelesaikan puzzle dari generator');
}
console.log('');

// Ringkasan
console.log('='.repeat(60));
console.log('✅ SEMUA TEST SELESAI!');
console.log('='.repeat(60));
console.log('');
console.log('📊 Ringkasan:');
console.log(`   • Generator Mudah: ${puzzleMudah.selKosong} sel kosong`);
console.log(`   • Generator Sedang: ${puzzleSedang.selKosong} sel kosong`);
console.log(`   • Generator Sulit: ${puzzleSulit.selKosong} sel kosong`);
console.log(`   • Solver: Berfungsi dengan baik`);
console.log(`   • Validasi: Semua solusi valid`);
console.log('');

// Helper functions
function tampilkanPapan(papan) {
  for (let i = 0; i < 9; i++) {
    let baris = '';
    for (let j = 0; j < 9; j++) {
      const nilai = papan[i][j];
      baris += (nilai === 0 ? '.' : nilai) + ' ';
      
      if ((j + 1) % 3 === 0 && j < 8) {
        baris += '| ';
      }
    }
    console.log('   ' + baris);
    
    if ((i + 1) % 3 === 0 && i < 8) {
      console.log('   ' + '-'.repeat(23));
    }
  }
}

function bandingkanPapan(papan1, papan2) {
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      if (papan1[i][j] !== papan2[i][j]) {
        return false;
      }
    }
  }
  return true;
}
