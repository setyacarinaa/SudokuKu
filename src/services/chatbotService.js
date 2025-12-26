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
const prosesPesanChatbot = (pesan, dataTekaTeki) => {
  const pesanHurufKecil = pesan.toLowerCase().trim();

  // Command: Hint
  if (pesanHurufKecil.includes('hint') || pesanHurufKecil.includes('petunjuk') || pesanHurufKecil.includes('bantuan')) {
    if (!dataTekaTeki || !dataTekaTeki.papan || !dataTekaTeki.solusi) {
      return {
        tipe: 'error',
        pesan: '❌ Tidak ada puzzle aktif. Silakan mulai game baru!'
      };
    }
    
    const hint = berikanHint(dataTekaTeki.papan, dataTekaTeki.solusi);
    return {
      tipe: 'hint',
      data: hint,
      pesan: hint.pesan
    };
  }

  // Command: Cek Jawaban
  if (pesanHurufKecil.includes('cek') || pesanHurufKecil.includes('validasi') || pesanHurufKecil.includes('periksa')) {
    if (!dataTekaTeki || !dataTekaTeki.papan || !dataTekaTeki.solusi) {
      return {
        tipe: 'error',
        pesan: '❌ Tidak ada puzzle aktif untuk dicek!'
      };
    }

    const hasil = validasiJawaban(dataTekaTeki.papan, dataTekaTeki.solusi);
    return {
      tipe: 'validasi',
      data: hasil,
      pesan: hasil.pesan
    };
  }

  // Command: Solusi
  if (pesanHurufKecil.includes('solusi') || pesanHurufKecil.includes('jawaban')) {
    if (!dataTekaTeki || !dataTekaTeki.solusi) {
      return {
        tipe: 'error',
        pesan: '❌ Tidak ada puzzle aktif!'
      };
    }

    return {
      tipe: 'solusi',
      data: { solusi: dataTekaTeki.solusi },
      pesan: '📋 Berikut adalah solusi lengkap puzzle ini:'
    };
  }

  // Command: Cara Main
  if (pesanHurufKecil.includes('cara') || pesanHurufKecil.includes('aturan') || pesanHurufKecil.includes('main')) {
    return {
      tipe: 'instruksi',
      pesan: `📖 Cara Bermain Sudoku:

1️⃣ Isi setiap sel kosong dengan angka 1-9
2️⃣ Setiap baris harus berisi angka 1-9 tanpa duplikat
3️⃣ Setiap kolom harus berisi angka 1-9 tanpa duplikat
4️⃣ Setiap kotak 3x3 harus berisi angka 1-9 tanpa duplikat

Perintah Chatbot:
• "hint" - Dapatkan petunjuk satu sel
• "cek jawaban" - Validasi jawaban saat ini
• "solusi" - Lihat solusi lengkap
• "cara main" - Lihat instruksi ini

Selamat bermain! 🎮`
    };
  }

  // Command: Salam
  if (pesanHurufKecil.includes('halo') || pesanHurufKecil.includes('hai') || pesanHurufKecil.includes('hello')) {
    return {
      tipe: 'salam',
      pesan: '👋 Halo! Saya chatbot SudokuKu. Saya bisa membantu kamu dengan:\n• Memberikan hint\n• Validasi jawaban\n• Menampilkan solusi\n• Menjelaskan cara bermain\n\nKetik "cara main" untuk instruksi lengkap!'
    };
  }

  // Command: Terima Kasih
  if (pesanHurufKecil.includes('terima kasih') || pesanHurufKecil.includes('makasih') || pesanHurufKecil.includes('thanks')) {
    return {
      tipe: 'ucapan',
      pesan: '😊 Sama-sama! Semangat bermain Sudoku!'
    };
  }

  // Command: Strategi Sudoku
  if (pesanHurufKecil.includes('strategi') || pesanHurufKecil.includes('teknik') || pesanHurufKecil.includes('sulit')) {
    return {
      tipe: 'strategi',
      pesan: `🧠 Strategi Bermain Sudoku:

1. Single Candidate (Kandidat Tunggal)
   Cari sel yang hanya memiliki satu angka yang mungkin diisi.

2. Hidden Single (Single Tersembunyi)
   Cari angka yang hanya bisa masuk di satu sel dalam baris/kolom/blok.

3. Scanning Rows & Columns
   Periksa setiap baris dan kolom untuk menemukan posisi angka.

4. Block/Jigsaw Checking
   Periksa setiap blok 3×3 untuk angka yang hilang.

5. Proses Eliminasi
   Tuliskan angka mungkin untuk setiap sel, lalu eliminasi saat menemukan angka baru.

Tips: Mulai dari sel dengan fewest candidates untuk progress lebih cepat!`
    };
  }

  // Command: Validasi Langkah
  if (pesanHurufKecil.includes('validasi') || pesanHurufKecil.includes('apakah langkah') || pesanHurufKecil.includes('benar')) {
    if (!dataTekaTeki || !dataTekaTeki.papan || !dataTekaTeki.solusi) {
      return {
        tipe: 'error',
        pesan: '❌ Tidak ada puzzle aktif untuk divalidasi. Mulai game baru terlebih dahulu!'
      };
    }

    let benar = 0, salah = 0, kosong = 0;
    let kesalahanDetail = [];
    let kesalahanObj = [];

    for (let baris = 0; baris < 9; baris++) {
      for (let kolom = 0; kolom < 9; kolom++) {
        const nilaiPemain = dataTekaTeki.papan[baris][kolom];
        const nilaiBenar = dataTekaTeki.solusi[baris][kolom];

        if (nilaiPemain === 0 || nilaiPemain === null) {
          kosong++;
        } else if (nilaiPemain === nilaiBenar) {
          benar++;
        } else {
          salah++;
          if (kesalahanDetail.length < 3) {
            kesalahanDetail.push(`Baris ${baris+1}, Kolom ${kolom+1}: ${nilaiPemain} ❌ (seharusnya ${nilaiBenar})`);
          }
          if (kesalahanObj.length < 3) {
            kesalahanObj.push({ baris: baris+1, kolom: kolom+1, nilaiPemain, nilaiBenar });
          }
        }
      }
    }

    let pesan = `📊 Status Jawaban Anda:
✅ Benar: ${benar}/81
❌ Salah: ${salah}
⬜ Kosong: ${kosong}

`;

    if (salah > 0) {
      pesan += `Kesalahan:\n`;
      kesalahanDetail.forEach(d => pesan += `• ${d}\n`);
      if (salah > 3) pesan += `• ... dan ${salah-3} kesalahan lainnya\n`;
      pesan += `\n💡 Gunakan "hint" untuk bantuan!`;
    } else if (kosong === 0) {
      pesan += `🎉 Selamat! Semua jawaban benar! Puzzle selesai!`;
    } else {
      pesan += `✨ Semua jawaban benar! Lanjutkan ${kosong} sel kosong.`;
    }

    return {
      tipe: 'validasi',
      data: {
        valid: (salah === 0),
        selesai: (kosong === 0 && salah === 0),
        kesalahan: kesalahanObj
      },
      pesan: pesan
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
