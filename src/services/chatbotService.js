/**
 * chatbotService.js
 * Service untuk menangani logic chatbot Sudoku
 * Menyediakan bantuan, hint, validasi, dan solusi
 */

const { selesaikanSudoku } = require('./sudokuSolver');
const { validasiPapanLengkap } = require('../utils/validasiSudoku');

/**
 * Dapatkan hint untuk satu sel kosong
 * @param {Array} papanSekarang - Papan Sudoku saat ini
 * @param {Array} solusi - Solusi lengkap Sudoku
 * @returns {Object} {baris, kolom, angka, pesan}
 */
const berikanHint = (papanSekarang, solusi) => {
  if (!papanSekarang || !solusi) {
    return {
      sukses: false,
      pesan: 'Data papan tidak valid!'
    };
  }

  // Cari sel kosong secara acak
  const selKosong = [];
  for (let baris = 0; baris < 9; baris++) {
    for (let kolom = 0; kolom < 9; kolom++) {
      if (papanSekarang[baris][kolom] === 0 || papanSekarang[baris][kolom] === null) {
        selKosong.push({ baris, kolom });
      }
    }
  }

  if (selKosong.length === 0) {
    return {
      sukses: false,
      pesan: 'Tidak ada sel kosong! Puzzle sudah selesai atau penuh.'
    };
  }

  // Pilih sel kosong secara acak
  const selTerpilih = selKosong[Math.floor(Math.random() * selKosong.length)];
  const { baris, kolom } = selTerpilih;
  const angka = solusi[baris][kolom];

  return {
    sukses: true,
    baris: baris,
    kolom: kolom,
    angka: angka,
    pesan: `💡 Hint: Sel di baris ${baris + 1}, kolom ${kolom + 1} seharusnya diisi dengan angka ${angka}`
  };
};

/**
 * Validasi jawaban pemain saat ini
 * @param {Array} papanPemain - Papan Sudoku yang diisi pemain
 * @param {Array} solusi - Solusi lengkap
 * @returns {Object} Hasil validasi
 */
const validasiJawaban = (papanPemain, solusi) => {
  if (!papanPemain || !solusi) {
    return {
      valid: false,
      pesan: 'Data papan tidak valid!'
    };
  }

  let kesalahan = [];
  let selesai = true;

  for (let baris = 0; baris < 9; baris++) {
    for (let kolom = 0; kolom < 9; kolom++) {
      const nilaiPemain = papanPemain[baris][kolom];
      const nilaiBenar = solusi[baris][kolom];

      // Cek jika ada sel kosong
      if (nilaiPemain === 0 || nilaiPemain === null) {
        selesai = false;
      }
      // Cek jika jawaban salah
      else if (nilaiPemain !== nilaiBenar) {
        kesalahan.push({
          baris: baris + 1,
          kolom: kolom + 1,
          nilaiPemain: nilaiPemain,
          nilaiBenar: nilaiBenar
        });
      }
    }
  }

  // Jika tidak ada kesalahan dan semua terisi
  if (kesalahan.length === 0 && selesai) {
    return {
      valid: true,
      selesai: true,
      pesan: '🎉 Selamat! Semua jawaban benar! Puzzle selesai!'
    };
  }

  // Jika masih ada sel kosong tapi jawaban sejauh ini benar
  if (kesalahan.length === 0 && !selesai) {
    return {
      valid: true,
      selesai: false,
      pesan: '✓ Sejauh ini jawabanmu benar! Lanjutkan mengisi sel kosong.'
    };
  }

  // Jika ada kesalahan
  return {
    valid: false,
    selesai: false,
    kesalahan: kesalahan,
    pesan: `❌ Ada ${kesalahan.length} kesalahan dalam jawabanmu. Coba periksa kembali!`
  };
};

/**
 * Proses pesan dari user dan berikan respons chatbot
 * @param {String} pesan - Pesan dari user
 * @param {Object} dataPuzzle - Data puzzle aktif {papan, solusi}
 * @returns {Object} Respons chatbot
 */
const prosesPesanChatbot = (pesan, dataPuzzle) => {
  const pesanLower = pesan.toLowerCase().trim();

  // Command: Hint
  if (pesanLower.includes('hint') || pesanLower.includes('petunjuk') || pesanLower.includes('bantuan')) {
    if (!dataPuzzle || !dataPuzzle.papan || !dataPuzzle.solusi) {
      return {
        tipe: 'error',
        pesan: '❌ Tidak ada puzzle aktif. Silakan mulai game baru!'
      };
    }
    
    const hint = berikanHint(dataPuzzle.papan, dataPuzzle.solusi);
    return {
      tipe: 'hint',
      data: hint,
      pesan: hint.pesan
    };
  }

  // Command: Cek Jawaban
  if (pesanLower.includes('cek') || pesanLower.includes('validasi') || pesanLower.includes('periksa')) {
    if (!dataPuzzle || !dataPuzzle.papan || !dataPuzzle.solusi) {
      return {
        tipe: 'error',
        pesan: '❌ Tidak ada puzzle aktif untuk dicek!'
      };
    }

    const hasil = validasiJawaban(dataPuzzle.papan, dataPuzzle.solusi);
    return {
      tipe: 'validasi',
      data: hasil,
      pesan: hasil.pesan
    };
  }

  // Command: Solusi
  if (pesanLower.includes('solusi') || pesanLower.includes('jawaban')) {
    if (!dataPuzzle || !dataPuzzle.solusi) {
      return {
        tipe: 'error',
        pesan: '❌ Tidak ada puzzle aktif!'
      };
    }

    return {
      tipe: 'solusi',
      data: { solusi: dataPuzzle.solusi },
      pesan: '📋 Berikut adalah solusi lengkap puzzle ini:'
    };
  }

  // Command: Cara Main
  if (pesanLower.includes('cara') || pesanLower.includes('aturan') || pesanLower.includes('main')) {
    return {
      tipe: 'instruksi',
      pesan: `📖 **Cara Bermain Sudoku:**

1️⃣ Isi setiap sel kosong dengan angka 1-9
2️⃣ Setiap baris harus berisi angka 1-9 tanpa duplikat
3️⃣ Setiap kolom harus berisi angka 1-9 tanpa duplikat
4️⃣ Setiap kotak 3x3 harus berisi angka 1-9 tanpa duplikat

**Perintah Chatbot:**
• "hint" - Dapatkan petunjuk satu sel
• "cek jawaban" - Validasi jawaban saat ini
• "solusi" - Lihat solusi lengkap
• "cara main" - Lihat instruksi ini

Selamat bermain! 🎮`
    };
  }

  // Command: Salam
  if (pesanLower.includes('halo') || pesanLower.includes('hai') || pesanLower.includes('hello')) {
    return {
      tipe: 'salam',
      pesan: '👋 Halo! Saya chatbot SudokuKu. Saya bisa membantu kamu dengan:\n• Memberikan hint\n• Validasi jawaban\n• Menampilkan solusi\n• Menjelaskan cara bermain\n\nKetik "cara main" untuk instruksi lengkap!'
    };
  }

  // Command: Terima Kasih
  if (pesanLower.includes('terima kasih') || pesanLower.includes('makasih') || pesanLower.includes('thanks')) {
    return {
      tipe: 'ucapan',
      pesan: '😊 Sama-sama! Semangat bermain Sudoku!'
    };
  }

  // Default response jika perintah tidak dikenali
  return {
    tipe: 'unknown',
    pesan: `🤔 Maaf, saya tidak mengerti perintah "${pesan}". 

Coba ketik:
• "hint" - untuk bantuan
• "cek jawaban" - untuk validasi
• "solusi" - untuk lihat jawaban
• "cara main" - untuk instruksi`
  };
};

module.exports = {
  prosesPesanChatbot,
  berikanHint,
  validasiJawaban
};
