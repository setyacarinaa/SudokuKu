/**
 * sudoku-frontend.js
 * Frontend logic untuk permainan Sudoku
 */

// State global
let papanSudoku = [];
let papanAsli = [];
let tingkatTerpilih = 'sedang';
let waktuMulai = null;
let timerInterval = null;
let skorPemain = 0;

// ==================== INISIALISASI ====================

document.addEventListener('DOMContentLoaded', () => {
  console.log('🎮 Sudoku Frontend dimuat');
  
  // Setup event listeners
  setupEventListeners();
  
  // Muat papan baru otomatis
  muatPapanBaru(tingkatTerpilih);
});

// ==================== EVENT LISTENERS ====================

function setupEventListeners() {
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
  const btnSelesaikan = document.getElementById('btn-selesaikan');
  const btnReset = document.getElementById('btn-reset');
  
  if (btnPapanBaru) btnPapanBaru.addEventListener('click', () => muatPapanBaru(tingkatTerpilih));
  if (btnCekJawaban) btnCekJawaban.addEventListener('click', cekJawaban);
  if (btnSelesaikan) btnSelesaikan.addEventListener('click', selesaikanPuzzle);
  if (btnReset) btnReset.addEventListener('click', resetPapan);
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
    
    // Simpan papan
    papanSudoku = data.data.papan;
    papanAsli = JSON.parse(JSON.stringify(data.data.papan)); // Deep copy
    
    // Render papan
    renderPapan();
    
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

function renderPapan() {
  const container = document.getElementById('papan-sudoku');
  if (!container) return;
  
  // Kosongkan container
  container.innerHTML = '';
  
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
      } else {
        input.value = '';
        
        // Event listener untuk input
        input.addEventListener('input', (e) => handleInput(e, baris, kolom));
        input.addEventListener('keydown', (e) => handleKeyboard(e, baris, kolom));
      }
      
      container.appendChild(input);
    }
  }
}

// ==================== HANDLE INPUT ====================

function handleInput(event, baris, kolom) {
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

function handleKeyboard(event, baris, kolom) {
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

async function cekJawaban() {
  try {
    // Kirim pesan ke chatbot untuk validasi
    if (window.kirimPesanChatbot) {
      window.kirimPesanChatbot('cek jawaban', papanSudoku);
    } else {
      tampilkanPesan('Chatbot tidak tersedia untuk validasi', 'error');
    }
  } catch (error) {
    console.error('❌ Error cek jawaban:', error);
    tampilkanPesan('Gagal memvalidasi jawaban', 'error');
  }
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
    // Minta solusi dari chatbot
    if (window.kirimPesanChatbot) {
      window.kirimPesanChatbot('solusi');
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
  renderPapan();
  
  // Reset timer
  mulaiTimer();
  
  tampilkanPesan('Papan direset ke kondisi awal', 'info');
}

// ==================== TIMER ====================

function mulaiTimer() {
  // Hentikan timer lama jika ada
  if (timerInterval) {
    clearInterval(timerInterval);
  }
  
  waktuMulai = Date.now();
  
  timerInterval = setInterval(() => {
    updateTimer();
  }, 1000);
  
  updateTimer();
}

function hentikanTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function updateTimer() {
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
  const container = document.getElementById('pesan-container');
  if (!container) {
    alert(pesan);
    return;
  }
  
  const div = document.createElement('div');
  div.className = `alert alert-${tipe}`;
  div.textContent = pesan;
  
  container.innerHTML = '';
  container.appendChild(div);
  
  // Auto hide setelah 5 detik
  setTimeout(() => {
    div.remove();
  }, 5000);
}

function tampilkanLoading(pesan = 'Memuat...') {
  const container = document.getElementById('pesan-container');
  if (container) {
    container.innerHTML = `
      <div class="alert alert-info">
        <span class="loading"></span> ${pesan}
      </div>
    `;
  }
}

function sembunyikanLoading() {
  const container = document.getElementById('pesan-container');
  if (container) {
    container.innerHTML = '';
  }
}

// ==================== EXPORT UNTUK CHATBOT ====================

window.dapatkanPapanSekarang = () => papanSudoku;
window.updatePapan = (papanBaru) => {
  papanSudoku = papanBaru;
  renderPapan();
};
