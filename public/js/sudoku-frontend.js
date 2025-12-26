/**
 * sudoku-frontend.js
 * Frontend logic untuk permainan Sudoku
 */

// State global
let papanSudoku = [];
let papanAsli = [];
let tingkatTerpilih = 'sedang';
let waktuMulai = null;
let intervalTimer = null;
let skorPemain = 0;
let selTerpilih = null; // Menyimpan sel yang sedang dipilih untuk keypad input
let nomorKeypadTerpilih = null; // Menyimpan nomor keypad yang sedang dipilih (highlight)
let errorCount = 0; // Tracking kesalahan (max 3)
let solusiSekarang = null; // Menyimpan solusi untuk validasi
let solusiDitampilkan = false; // Jika true, pemain tidak boleh submit/rekam skor
const MAX_ERRORS = 3; // Batas maksimal kesalahan
// transient highlight removed; persistent toggle highlighting used instead

// ==================== INISIALISASI ====================

document.addEventListener('DOMContentLoaded', () => {
  console.log('🎮 Sudoku Frontend dimuat');
  
  // Pasang event listener
  pasangPendengarEvent();
  
  // Muat papan baru otomatis
  muatPapanBaru(tingkatTerpilih);
});

// ==================== EVENT LISTENERS ====================

function pasangPendengarEvent() {
  // Tombol tingkat kesulitan
  const tombolMudah = document.getElementById('btn-mudah');
  const tombolSedang = document.getElementById('btn-sedang');
  const tombolSulit = document.getElementById('btn-sulit');
  
  if (tombolMudah) tombolMudah.addEventListener('click', () => pilihTingkat('mudah'));
  if (tombolSedang) tombolSedang.addEventListener('click', () => pilihTingkat('sedang'));
  if (tombolSulit) tombolSulit.addEventListener('click', () => pilihTingkat('sulit'));
  
  // Tombol game
  const btnPapanBaru = document.getElementById('btn-papan-baru');
  const btnCekJawaban = document.getElementById('btn-cek-jawaban');
  const btnSubmitJawaban = document.getElementById('btn-submit-jawaban');
  const btnSelesaikan = document.getElementById('btn-selesaikan');
  const btnReset = document.getElementById('btn-reset');
  
  if (btnPapanBaru) btnPapanBaru.addEventListener('click', () => muatPapanBaru(tingkatTerpilih));
  if (btnCekJawaban) btnCekJawaban.addEventListener('click', cekJawaban);
  if (btnSubmitJawaban) btnSubmitJawaban.addEventListener('click', submitJawabanFinal);
  if (btnSelesaikan) btnSelesaikan.addEventListener('click', selesaikanPuzzle);
  if (btnReset) btnReset.addEventListener('click', resetPapan);

  // Pasang listener untuk tombol keypad (jika ada)
  document.querySelectorAll('.btn-keypad').forEach(btn => {
    const handlePress = (e) => {
      e.preventDefault();
      const txt = btn.textContent.trim();
      const angka = parseInt(txt);
      if (Number.isInteger(angka)) {
        handleKeypadPress(angka);
        return;
      }

      // Hapus / delete button detection
      const action = (btn.dataset && btn.dataset.action) ? btn.dataset.action.toLowerCase() : '';
      if (action === 'delete' || action === 'hapus' || /del|hapus|⌫|backspace/i.test(txt)) {
        hapusAngkaViaKeypad();
        return;
      }

      // Fallback: if button labeled C or clear
      if (/^c$|clear/i.test(txt)) {
        hapusAngkaViaKeypad();
        return;
      }
    };

    btn.addEventListener('click', handlePress);
    btn.addEventListener('touchstart', handlePress);
  });
}

// ==================== TINGKAT KESULITAN ====================

function pilihTingkat(tingkat) {
  tingkatTerpilih = tingkat;
  
  // Update tampilan tombol
  document.querySelectorAll('.tingkat-kesulitan .btn').forEach(btn => {
    btn.classList.remove('btn-primary');
    btn.classList.add('btn-secondary');
  });
  
  const btnAktif = document.getElementById(`btn-${tingkat}`);
  if (btnAktif) {
    btnAktif.classList.remove('btn-secondary');
    btnAktif.classList.add('btn-primary');
  }
  
  // Muat papan baru
  muatPapanBaru(tingkat);
}

// ==================== MUAT PAPAN BARU ====================

async function muatPapanBaru(tingkat) {
  try {
    tampilkanLoading('Membuat puzzle baru...');
    
    // Request API untuk papan baru
    const response = await fetch(`/api/papan?tingkat=${tingkat}`);
    const data = await response.json();
    
    if (!data.sukses) {
      throw new Error(data.pesan || 'Gagal memuat papan');
    }
    
    // Simpan papan dan solusi
    papanSudoku = data.data.papan;
    papanAsli = JSON.parse(JSON.stringify(data.data.papan)); // Deep copy
    solusiSekarang = data.data.solusi; // Capture solusi dari API
    // Reset flag solusi ditampilkan dan sinkronkan ke server (reset hint counter)
    solusiDitampilkan = false;
    try { window.solusiDitampilkan = false; } catch (e) { }
    try {
      fetch('/api/reset-hints', { method: 'POST', credentials: 'include' }).catch(() => {});
    } catch (e) {}
    
    // Reset error counter
    errorCount = 0;
    updateErrorCounter();
    
    tampilkanPapan();
    
    // Mulai timer
    mulaiTimer();
    
    sembunyikanLoading();
    tampilkanPesan(`Puzzle ${tingkat} berhasil dimuat! Selamat bermain! 🎮`, 'success');
    
    console.log('✅ Papan baru dimuat:', data.data);
  } catch (error) {
    console.error('❌ Error memuat papan:', error);
    sembunyikanLoading();
    tampilkanPesan('Gagal memuat papan baru. Coba lagi.', 'error');
  }
}

// ==================== RENDER PAPAN ====================

function tampilkanPapan() {
  const kontainer = document.getElementById('papan-sudoku');
  if (!kontainer) return;
  
  // Kosongkan container
  kontainer.innerHTML = '';
  
  // Buat sel untuk setiap angka
  for (let baris = 0; baris < 9; baris++) {
    for (let kolom = 0; kolom < 9; kolom++) {
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'sel-sudoku';
      input.maxLength = 1;
      input.dataset.baris = baris;
      input.dataset.kolom = kolom;
      
      const nilai = papanSudoku[baris][kolom];
      
      if (nilai !== 0) {
        input.value = nilai;
        input.classList.add('tetap');
        input.readOnly = true;
        // Click/tap handler for fixed cells: select and highlight same numbers
        input.addEventListener('click', (e) => {
          pilihSel(e, input, baris, kolom);
          // highlight all cells with same number
          try { pilihNomorKeypad(Number(input.value), true); } catch (e) { }
        });
        input.addEventListener('touchstart', (e) => { e.preventDefault(); pilihSel(e, input, baris, kolom); try { pilihNomorKeypad(Number(input.value), true); } catch (e) {} });
        // Press animation for fixed cells as well
        input.addEventListener('mousedown', (e) => { input.classList.add('sel-pressed'); });
        input.addEventListener('mouseup', (e) => { input.classList.remove('sel-pressed'); });
        input.addEventListener('mouseleave', (e) => { input.classList.remove('sel-pressed'); });
        input.addEventListener('touchstart', (e) => { input.classList.add('sel-pressed'); });
        input.addEventListener('touchend', (e) => { input.classList.remove('sel-pressed'); });
      } else {
        input.value = '';
        // Make cell readonly so mobile keyboard won't open; selection handled via click/touch
        input.readOnly = true;

        // Event listener untuk input via keypad and selection
        input.addEventListener('click', (e) => pilihSel(e, input, baris, kolom));
        input.addEventListener('touchstart', (e) => { e.preventDefault(); pilihSel(e, input, baris, kolom); });
        // Press animation: add class while pressing/touching
        input.addEventListener('mousedown', (e) => { input.classList.add('sel-pressed'); });
        input.addEventListener('mouseup', (e) => { input.classList.remove('sel-pressed'); });
        input.addEventListener('mouseleave', (e) => { input.classList.remove('sel-pressed'); });
        input.addEventListener('touchstart', (e) => { input.classList.add('sel-pressed'); });
        input.addEventListener('touchend', (e) => { input.classList.remove('sel-pressed'); });
        // Prevent keyboard from showing if focus occurs
        input.addEventListener('focus', (e) => { e.preventDefault(); input.blur(); });
      }

      kontainer.appendChild(input);
    }
  }
}

// ==================== INPUT VIA KEYPAD ====================

/**
 * Input angka melalui tombol keypad
 * @param {Number} angka - Angka yang akan diinput (1-9)
 */
function inputAngkaViaKeypad(angka) {
  if (!selTerpilih) {
    tampilkanPesan('Pilih sel terlebih dahulu!', 'info');
    return;
  }
  // Jika sel adalah sel tetap dari sistem, maka tombol keypad tidak akan mengisi.
  // Sebagai gantinya kita highlight semua angka yang sama.
  if (selTerpilih.classList.contains('tetap')) {
    pilihNomorKeypad(angka, true);
    return;
  }

  const baris = parseInt(selTerpilih.dataset.baris);
  const kolom = parseInt(selTerpilih.dataset.kolom);

  // Update nilai
  selTerpilih.value = angka;
  papanSudoku[baris][kolom] = angka;
  selTerpilih.classList.add('diisi');
  selTerpilih.classList.remove('salah');

  // Cek apakah puzzle selesai
  if (cekPuzzleSelesai()) {
    setTimeout(() => {
      selesaiPermainan();
    }, 500);
  }

  // Fokus ke sel berikutnya otomatis
  const sebelahKanan = document.querySelector(`[data-baris="${baris}"][data-kolom="${kolom + 1}"]`);
  if (sebelahKanan && !sebelahKanan.readOnly) {
    sebelahKanan.focus();
  }

  // Clear any persistent keypad highlight after filling (keypad shouldn't stay active)
  pilihNomorKeypad(null);
}

/**
 * Hapus angka dari sel yang sedang dipilih via keypad
 */
function hapusAngkaViaKeypad() {
  if (!selTerpilih) {
    tampilkanPesan('Pilih sel terlebih dahulu!', 'info');
    return;
  }
  if (selTerpilih.classList.contains('tetap')) {
    tampilkanPesan('Sel ini tidak bisa diubah!', 'error');
    return;
  }

  const baris = parseInt(selTerpilih.dataset.baris);
  const kolom = parseInt(selTerpilih.dataset.kolom);

  selTerpilih.value = '';
  papanSudoku[baris][kolom] = 0;
  selTerpilih.classList.remove('diisi', 'salah');
}

/**
 * Unified handler for keypad presses.
 * - Jika tidak ada sel terpilih -> hanya beri tahu pemain
 * - Jika sel terpilih adalah 'tetap' (diisi sistem) -> highlight semua cell yang memiliki angka tersebut
 * - Jika sel terpilih kosong/editor -> isi sel dengan angka
 */
function handleKeypadPress(angka) {
  // If no cell selected: toggle highlight for the number
  if (!selTerpilih) {
    pilihNomorKeypad(angka);
    return;
  }

  // If selected cell is a system-fixed cell: toggle highlight for that number
  if (selTerpilih.classList.contains('tetap')) {
    pilihNomorKeypad(angka);
    return;
  }

  // If selected cell is editable: fill it (do not leave keypad persistently active)
  inputAngkaViaKeypad(angka);
}

/**
 * Highlight matching numbers transiently (used when selecting a system-filled cell)
 * Adds a temporary class to matching cells and removes it after animation.
 */
// transient highlighting removed in favor of persistent toggle via pilihNomorKeypad

// ==================== HANDLE INPUT ====================

// Function to select a cell (without opening keyboard)
function pilihSel(e, input, baris, kolom) {
  // Remove previous selection style
  document.querySelectorAll('.sel-sudoku.sel-terpilih').forEach(s => s.classList.remove('sel-terpilih'));

  selTerpilih = input;
  input.classList.add('sel-terpilih');
  // Jika sel sudah berisi angka (baik dari sistem atau diisi pemain), tampilkan transient highlight ungu muda
  const nilai = input.value ? parseInt(input.value) : null;
  if (nilai) {
    // Toggle persistent highlight for the selected number
    pilihNomorKeypad(nilai);
    return;
  }

  // Jika sel kosong, pastikan tidak ada persistent highlight aktif
  pilihNomorKeypad(null);
}

// Handle keypad number highlight & optional fill
function pilihNomorKeypad(angka, keepActive = false) {
  // If angka is null -> clear
  if (angka === null) {
    nomorKeypadTerpilih = null;
    document.querySelectorAll('.btn-keypad.btn-active').forEach(b => b.classList.remove('btn-active'));
    document.querySelectorAll('.sel-sudoku.nomor-terpilih').forEach(s => s.classList.remove('nomor-terpilih'));
    return;
  }

  // Toggle if same
  if (nomorKeypadTerpilih === angka && !keepActive) {
    pilihNomorKeypad(null);
    return;
  }

  nomorKeypadTerpilih = angka;

  // Toggle active class for keypad buttons
  document.querySelectorAll('.btn-keypad').forEach(btn => {
    if (parseInt(btn.textContent) === angka) btn.classList.add('btn-active');
    else btn.classList.remove('btn-active');
  });

  // Highlight cells that have the same number
  document.querySelectorAll('.sel-sudoku.nomor-terpilih').forEach(s => s.classList.remove('nomor-terpilih'));
  document.querySelectorAll('.sel-sudoku').forEach(s => {
    if (s.value && parseInt(s.value) === angka) s.classList.add('nomor-terpilih');
  });
}

function tanganiInput(event, baris, kolom) {
  const input = event.target;
  let nilai = input.value;
  
  // Hanya terima angka 1-9
  if (!/^[1-9]$/.test(nilai)) {
    input.value = '';
    papanSudoku[baris][kolom] = 0;
    input.classList.remove('diisi', 'salah');
    return;
  }
  
  // Update papan
  papanSudoku[baris][kolom] = parseInt(nilai);
  input.classList.add('diisi');
  input.classList.remove('salah');
  
  // Cek apakah puzzle selesai
  if (cekPuzzleSelesai()) {
    setTimeout(() => {
      selesaiPermainan();
    }, 500);
  }
}

// ==================== KEYBOARD NAVIGATION ====================

function tanganiKeyboard(event, baris, kolom) {
  let targetBaris = baris;
  let targetKolom = kolom;
  
  switch(event.key) {
    case 'ArrowUp':
      targetBaris = Math.max(0, baris - 1);
      event.preventDefault();
      break;
    case 'ArrowDown':
      targetBaris = Math.min(8, baris + 1);
      event.preventDefault();
      break;
    case 'ArrowLeft':
      targetKolom = Math.max(0, kolom - 1);
      event.preventDefault();
      break;
    case 'ArrowRight':
      targetKolom = Math.min(8, kolom + 1);
      event.preventDefault();
      break;
    case 'Backspace':
    case 'Delete':
      papanSudoku[baris][kolom] = 0;
      event.target.value = '';
      event.target.classList.remove('diisi', 'salah');
      break;
    default:
      return;
  }
  
  // Fokus ke sel target
  const targetSel = document.querySelector(`[data-baris="${targetBaris}"][data-kolom="${targetKolom}"]`);
  if (targetSel && !targetSel.readOnly) {
    targetSel.focus();
  }
}

// ==================== CEK JAWABAN ====================

function cekJawaban() {
  if (!solusiSekarang) {
    tampilkanPesan('Solusi tidak tersedia', 'error');
    return;
  }

  // Cari sel yang salah
  const selSalah = [];
  for (let baris = 0; baris < 9; baris++) {
    for (let kolom = 0; kolom < 9; kolom++) {
      const nilaiPemain = papanSudoku[baris][kolom];
      const nilaiBenar = solusiSekarang[baris][kolom];
      
      // Cek jika ada nilai dan salah
      if (nilaiPemain !== 0 && nilaiPemain !== nilaiBenar) {
        selSalah.push({ baris, kolom });
      }
    }
  }

  // Highlight sel yang salah
  highlightSelSalah(selSalah);

  if (selSalah.length > 0) {
    // Ada kesalahan - increment counter
    errorCount++;
    updateErrorCounter();
    tampilkanPesan(`⚠️ Ada ${selSalah.length} jawaban yang salah! (${errorCount}/${MAX_ERRORS})`, 'warning');
    
    // Cek apakah sudah exceed limit
    if (errorCount >= MAX_ERRORS) {
      gameOver(false); // false = kalah
    }
  } else {
    tampilkanPesan('✓ Semua jawaban yang Anda isi benar! Lanjutkan atau submit untuk menyelesaikan.', 'success');
  }
}

// ==================== HIGHLIGHT SEL SALAH ====================

function highlightSelSalah(selSalah) {
  // Hapus highlight sebelumnya
  document.querySelectorAll('.sel-sudoku.salah').forEach(sel => {
    sel.classList.remove('salah');
  });

  // Highlight sel salah dengan animasi
  selSalah.forEach(({ baris, kolom }) => {
    const sel = document.querySelector(`[data-baris="${baris}"][data-kolom="${kolom}"]`);
    if (sel) {
      sel.classList.add('salah');
      // Animasi shake
      sel.style.animation = 'none';
      setTimeout(() => {
        sel.style.animation = 'shake 0.5s';
      }, 10);
    }
  });
}

// ==================== SUBMIT JAWABAN FINAL ====================

function submitJawabanFinal() {
  // Prevent submitting if solution was shown
  if (window.solusiDitampilkan || solusiDitampilkan) {
    tampilkanPesan('❌ Tidak bisa submit setelah melihat solusi. Pertandingan tidak akan dihitung.', 'error');
    return;
  }
  if (!solusiSekarang) {
    tampilkanPesan('Solusi tidak tersedia', 'error');
    return;
  }

  // Cek apakah semua sel terisi
  if (!cekPuzzleSelesai()) {
    tampilkanPesan('⚠️ Masih ada sel kosong! Lengkapi semua sel terlebih dahulu.', 'warning');
    return;
  }

  // Validasi semua jawaban
  let adaYangSalah = false;
  const selSalah = [];

  for (let baris = 0; baris < 9; baris++) {
    for (let kolom = 0; kolom < 9; kolom++) {
      const nilaiPemain = papanSudoku[baris][kolom];
      const nilaiBenar = solusiSekarang[baris][kolom];
      
      if (nilaiPemain !== nilaiBenar) {
        adaYangSalah = true;
        selSalah.push({ baris, kolom });
      }
    }
  }

  if (adaYangSalah) {
    // Ada kesalahan
    errorCount++;
    updateErrorCounter();
    highlightSelSalah(selSalah);
    tampilkanPesan(`❌ Ada ${selSalah.length} jawaban yang salah! (${errorCount}/${MAX_ERRORS})`, 'error');
    
    if (errorCount >= MAX_ERRORS) {
      gameOver(false); // Kalah
    }
  } else {
    // Semua benar! Selesai
    gameOver(true); // Menang
  }
}

// ==================== UPDATE ERROR COUNTER ====================

function updateErrorCounter() {
  const errorBadge = document.getElementById('error-count');
  if (errorBadge) {
    errorBadge.textContent = errorCount;
    // Animasi
    errorBadge.style.animation = 'pulse 0.5s';
    setTimeout(() => {
      errorBadge.style.animation = 'none';
    }, 500);
  }
}

// ==================== GAME OVER ====================

async function gameOver(menang) {
  hentikanTimer();
  const waktuBermain = hitungWaktu();

  if (menang) {
    // Hitung skor
    const durasiDetik = Math.floor((new Date() - waktuMulai) / 1000);
    const skorFinal = hitungSkor(durasiDetik, tingkatTerpilih);
    
    // Rekam skor ke database (jika user login)
    try {
      const responseRekam = await fetch('/api/rekam-skor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          waktuPenyelesaian: durasiDetik,
          tingkatKesulitan: tingkatTerpilih
        })
      });
      
      const dataRekam = await responseRekam.json();
      console.log('📊 Response rekam skor:', dataRekam);
      
      if (!dataRekam.sukses) {
        console.warn('⚠️ Gagal rekam skor, tapi game tetap selesai');
      }
    } catch (errorRekam) {
      console.error('❌ Error rekam skor:', errorRekam);
      // Lanjutkan meskipun rekam skor gagal
    }
    
    // Tampilkan overlay success
    tampilkanOverlaySelesai(durasiDetik, skorFinal);
    
  } else {
    // Pemain kalah - kesalahan melebihi batas
    tampilkanPesan('❌ Game Over! Batas kesalahan terlampaui. Game direset.', 'error');
    
    // Reset game
    setTimeout(() => {
      errorCount = 0;
      updateErrorCounter();
      muatPapanBaru(tingkatTerpilih);
      tampilkanPesan('🔄 Game telah direset. Coba lagi!', 'info');
    }, 2500);
  }
}

// ==================== OVERLAY SELESAI ====================

function tampilkanOverlaySelesai(durasiDetik, skorFinal) {
  // Cek apakah overlay sudah ada
  let overlay = document.getElementById('overlay-selesai');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'overlay-selesai';
    overlay.className = 'overlay-selesai';
    
    overlay.innerHTML = `
      <div class="overlay-content">
        <div class="overlay-emoji">🎉</div>
        <h1 class="overlay-title">SELAMAT!</h1>
        <p class="overlay-subtitle">Puzzle Diselesaikan dengan Sempurna!</p>
        
        <div class="overlay-stats">
          <div class="overlay-stat">
            <span class="overlay-stat-icon">⏱️</span>
            <span class="overlay-stat-label">Waktu</span>
            <span class="overlay-stat-value">${formatWaktu(durasiDetik)}</span>
          </div>
          <div class="overlay-stat">
            <span class="overlay-stat-icon">🏆</span>
            <span class="overlay-stat-label">Skor</span>
            <span class="overlay-stat-value">${skorFinal}</span>
          </div>
          <div class="overlay-stat">
            <span class="overlay-stat-icon">📊</span>
            <span class="overlay-stat-label">Level</span>
            <span class="overlay-stat-value">${tingkatTerpilih.charAt(0).toUpperCase() + tingkatTerpilih.slice(1)}</span>
          </div>
        </div>
        
        <div class="overlay-actions">
          <a href="/sudoku" class="btn btn-primary btn-lg overlay-btn">🎮 Main Lagi</a>
          <a href="/" class="btn btn-secondary btn-lg overlay-btn">🏠 Kembali ke Beranda</a>
          <button id="btn-overlay-leaderboard" class="btn btn-tertiary btn-lg overlay-btn">🏅 Lihat Leaderboard</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
  }
  
  // Show overlay dengan animasi
  overlay.style.display = 'flex';
  overlay.offsetHeight; // Trigger reflow
  overlay.classList.add('show');

  // Pasang listener untuk tombol Leaderboard yang akan cek status login terlebih dahulu
  const btnLeaderboard = document.getElementById('btn-overlay-leaderboard');
  if (btnLeaderboard) {
    btnLeaderboard.addEventListener('click', async () => {
      try {
        // Include credentials so server can read session cookie and determine login state
        const res = await fetch('/api/whoami', { credentials: 'include', headers: { 'Accept': 'application/json' } });
        if (res.ok) {
          const j = await res.json();
          // Jika backend memberi tahu user terautentikasi, langsung ke leaderboard
          if (j && (j.sukses || j.user)) {
            window.location.href = '/leaderboard';
            return;
          }
        }
      } catch (e) {
        // ignore network/parse errors, fall through to login redirect
      }
      // Jika tidak terautentikasi atau gagal cek, arahkan ke login dengan redirect kembali ke leaderboard setelah login
      window.location.href = '/login?next=/leaderboard';
    });
  }
  
  // Auto-redirect dihapus; pemain memilih aksi sendiri
}

// ==================== FORMAT WAKTU ====================

function formatWaktu(detik) {
  const menit = Math.floor(detik / 60);
  const sisa = detik % 60;
  return `${menit.toString().padStart(2, '0')}:${sisa.toString().padStart(2, '0')}`;
}

// ==================== HITUNG SKOR ====================

function hitungSkor(durasiDetik, tingkat) {
  // Base skor berdasarkan tingkat
  let baseSkor = 0;
  if (tingkat === 'mudah') baseSkor = 100;
  else if (tingkat === 'sedang') baseSkor = 300;
  else baseSkor = 500;

  // Bonus waktu (semakin cepat, semakin banyak bonus)
  let bonusWaktu = 0;
  if (tingkat === 'mudah') {
    if (durasiDetik < 300) bonusWaktu = 200; // < 5 menit
    else if (durasiDetik < 600) bonusWaktu = 100; // < 10 menit
    else bonusWaktu = 50; // > 10 menit
  } else if (tingkat === 'sedang') {
    if (durasiDetik < 600) bonusWaktu = 300; // < 10 menit
    else if (durasiDetik < 900) bonusWaktu = 200; // < 15 menit
    else bonusWaktu = 100; // > 15 menit
  } else {
    if (durasiDetik < 900) bonusWaktu = 500; // < 15 menit
    else if (durasiDetik < 1800) bonusWaktu = 300; // < 30 menit
    else bonusWaktu = 150; // > 30 menit
  }

  return baseSkor + bonusWaktu;
}

// ==================== CEK PUZZLE SELESAI ====================

function cekPuzzleSelesai() {
  // Cek apakah semua sel terisi
  for (let baris = 0; baris < 9; baris++) {
    for (let kolom = 0; kolom < 9; kolom++) {
      if (papanSudoku[baris][kolom] === 0) {
        return false;
      }
    }
  }
  return true;
}

// ==================== SELESAI PERMAINAN ====================

async function selesaiPermainan() {
  // Hentikan timer
  hentikanTimer();
  
  const waktuSelesai = hitungWaktu();
  
  // Simpan skor
  try {
    const response = await fetch('/api/rekam-skor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        waktuPenyelesaian: waktuSelesai,
        tingkatKesulitan: tingkatTerpilih
      })
    });
    
    const data = await response.json();
    
    if (data.sukses) {
      skorPemain = data.data.skor;
      tampilkanPesan(
        `🎉 Selamat! Puzzle selesai dalam ${formatWaktu(waktuSelesai)}! Skor: ${skorPemain}`,
        'success'
      );
      
      // Tanya apakah mau main lagi
      setTimeout(() => {
        if (confirm('Main lagi dengan puzzle baru?')) {
          muatPapanBaru(tingkatTerpilih);
        }
      }, 2000);
    }
  } catch (error) {
    console.error('❌ Error menyimpan skor:', error);
    tampilkanPesan('Puzzle selesai! Tapi gagal menyimpan skor.', 'error');
  }
}

// ==================== SELESAIKAN PUZZLE (HINT LENGKAP) ====================

async function selesaikanPuzzle() {
  if (!confirm('Yakin ingin melihat solusi lengkap? Skor tidak akan disimpan.')) {
    return;
  }
  
  try {
    // Tandai bahwa solusi akan ditampilkan (frontend guard)
    solusiDitampilkan = true;
    window.solusiDitampilkan = true;

    // Minta solusi dari chatbot
    if (window.kirimPesanKeChatbot) {
      window.kirimPesanKeChatbot('solusi');
    }
  } catch (error) {
    console.error('❌ Error mendapatkan solusi:', error);
    tampilkanPesan('Gagal mendapatkan solusi', 'error');
  }
}

// ==================== RESET PAPAN ====================

function resetPapan() {
  if (!confirm('Reset papan ke kondisi awal?')) {
    return;
  }
  
  // Kembalikan ke papan asli
  papanSudoku = JSON.parse(JSON.stringify(papanAsli));
  tampilkanPapan();
  
  // Reset timer
  mulaiTimer();
  
  tampilkanPesan('Papan direset ke kondisi awal', 'info');
}

// ==================== TIMER ====================

function mulaiTimer() {
  // Hentikan timer lama jika ada
  if (intervalTimer) {
    clearInterval(intervalTimer);
  }
  
  waktuMulai = Date.now();
  
  intervalTimer = setInterval(() => {
    perbaruiTimer();
  }, 1000);
  
  perbaruiTimer();
}

function hentikanTimer() {
  if (intervalTimer) {
    clearInterval(intervalTimer);
    intervalTimer = null;
  }
}

function perbaruiTimer() {
  const waktu = hitungWaktu();
  const timerElement = document.getElementById('timer');
  if (timerElement) {
    timerElement.textContent = formatWaktu(waktu);
  }
}

function hitungWaktu() {
  if (!waktuMulai) return 0;
  return Math.floor((Date.now() - waktuMulai) / 1000);
}

function formatWaktu(detik) {
  const menit = Math.floor(detik / 60);
  const sisa = detik % 60;
  return `${menit.toString().padStart(2, '0')}:${sisa.toString().padStart(2, '0')}`;
}

// ==================== UI HELPERS ====================

function tampilkanPesan(pesan, tipe = 'info') {
  const kontainerPesan = document.getElementById('pesan-container');
  if (!kontainerPesan) {
    alert(pesan);
    return;
  }
  
  const div = document.createElement('div');
  div.className = `alert alert-${tipe}`;
  div.textContent = pesan;
  
  kontainerPesan.innerHTML = '';
  kontainerPesan.appendChild(div);
  
  // Auto hide setelah 5 detik
  setTimeout(() => {
    div.remove();
  }, 5000);
}

function tampilkanLoading(pesan = 'Memuat...') {
  const kontainerPesan = document.getElementById('pesan-container');
  if (kontainerPesan) {
    kontainerPesan.innerHTML = `
      <div class="alert alert-info">
        <span class="loading"></span> ${pesan}
      </div>
    `;
  }
}

function sembunyikanLoading() {
  const kontainerPesan = document.getElementById('pesan-container');
  if (kontainerPesan) {
    kontainerPesan.innerHTML = '';
  }
}

// ==================== EXPORT UNTUK CHATBOT ====================

window.dapatkanPapanSekarang = () => papanSudoku;
window.updatePapan = (papanBaru) => {
  papanSudoku = papanBaru;
  tampilkanPapan();
};

// Expose solusi saat ini untuk chatbot (berguna pada environment serverless tanpa session)
window.dapatkanSolusiSekarang = () => solusiSekarang;

// Helper: tambahkan 1 kesalahan (dipanggil oleh chatbot ketika melakukan 'cek jawaban')
window.tambahKesalahan = (kesalahanList) => {
  try {
    // Tambah 1 kesalahan terlepas dari berapa banyak sel yang salah (sama seperti fitur Cek Jawaban)
    errorCount = (typeof errorCount === 'number') ? errorCount + 1 : 1;
    updateErrorCounter();

    // highlight kesalahan (convert to zero-based) — dukung input 1-based atau 0-based
    if (Array.isArray(kesalahanList) && kesalahanList.length > 0) {
      const selArr = kesalahanList.map(k => {
        // coba baca berbagai bentuk (baris/kolom sebagai number atau string)
        let b = Number(k.baris);
        let c = Number(k.kolom);

        if (!Number.isFinite(b)) b = Number(k.row);
        if (!Number.isFinite(c)) c = Number(k.col);

        if (!Number.isFinite(b)) b = 0;
        if (!Number.isFinite(c)) c = 0;

        // Jika nilai tampak 1-based (1..9), ubah ke 0-based
        if (b >= 1 && b <= 9) b = b - 1;
        // Jika sudah 0-based (0..8), biarkan
        if (c >= 1 && c <= 9) c = c - 1;

        // Clamp pada rentang 0..8
        b = Math.max(0, Math.min(8, b));
        c = Math.max(0, Math.min(8, c));

        return { baris: b, kolom: c };
      });

      highlightSelSalah(selArr);
    }

    // Jika batas kesalahan tercapai, trigger game over
    if (errorCount >= MAX_ERRORS) {
      if (typeof gameOver === 'function') gameOver(false);
    }
  } catch (e) {
    console.warn('tambahKesalahan gagal:', e);
  }
};
