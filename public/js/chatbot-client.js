/**
 * chatbot-client.js
 * Frontend untuk Socket.IO chatbot
 */

// Inisialisasi Socket.IO dengan path fallback
let soket = null;
let sudahCobaAlternate = false;
const socketPaths = ['/api/socket.io', '/socket.io'];

function buatSoket(path) {
  return io({
    path,
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 3,
    reconnectionDelay: 500
  });
}

function pilihPathAwal() {
  const host = window.location.hostname;
  const isLocal = host === 'localhost' || host === '127.0.0.1';
  // Lokal pakai /socket.io, produksi coba /api/socket.io dulu
  return isLocal ? 1 : 0;
}

// State chatbot
let chatbotTerbuka = false;

// ==================== INISIALISASI ====================

document.addEventListener('DOMContentLoaded', () => {
  console.log('💬 Chatbot client dimuat');
  
  siapkanChatbot();
  siapkanEventSoket();
  // Helper toggle
  const ambilKontainerChatbot = () => document.querySelector('#chatbot-container');
  const ambilTombolTutup = () => document.querySelector('#chatbot-toggle, .chatbot-toggle');
  const ambilHeaderChatbot = () => document.querySelector('#chatbot-header');

  const sembunyikanChatbot = () => {
    const kontainer = ambilKontainerChatbot();
    if (kontainer) {
      kontainer.classList.add('chatbot-hidden');
      kontainer.style.display = 'none';
    }
  };

  const tampilkanChatbot = () => {
    const kontainer = ambilKontainerChatbot();
    if (kontainer) {
      kontainer.classList.remove('chatbot-hidden');
      kontainer.style.display = 'block';
    }
  };

  // Tombol tutup (ikon X)
  const tombolTutup = ambilTombolTutup();
  if (tombolTutup) {
    tombolTutup.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      sembunyikanChatbot();
    });
  }

  // Header double-click untuk collapse/expand
  const header = ambilHeaderChatbot();
  if (header) {
    header.addEventListener('dblclick', () => {
      window.alihChatbot();
    });
  }

  // Gunakan toggle global utama
  window.alihChatbot = alihChatbot;
});

// ==================== SETUP CHATBOT UI ====================

function siapkanChatbot() {
  // Tombol toggle chatbot
  const btnToggle = document.getElementById('chatbot-toggle-btn');
  if (btnToggle) {
    btnToggle.addEventListener('click', alihChatbot);
  }
  
  // Form input chatbot
  const formChatbot = document.getElementById('form-chatbot');
  if (formChatbot) {
    formChatbot.addEventListener('submit', (e) => {
      e.preventDefault();
      kirimPesanPengguna();
    });
  }
  
  // Tombol cepat
  const btnHint = document.getElementById('btn-hint-chat');
  if (btnHint) {
    btnHint.addEventListener('click', () => {
      kirimPesanKeChatbot('hint', null, { quick: true });
    });
  }
  
  // Pesan sambutan
  tambahPesanBot('👋 Halo! Saya chatbot SudokuKu. Ketik "cara main" untuk instruksi atau "hint" untuk bantuan!');
}

// ==================== TOGGLE CHATBOT ====================

function alihChatbot(forceState) {
  const kontainerChatbot = document.getElementById('chatbot-container');
  const btnToggle = document.getElementById('chatbot-toggle-btn');
  if (!kontainerChatbot) return;

  // Tentukan target state
  const targetOpen = forceState === true ? true : forceState === false ? false : !chatbotTerbuka;
  chatbotTerbuka = targetOpen;

  if (chatbotTerbuka) {
    kontainerChatbot.classList.remove('chatbot-hidden');
    kontainerChatbot.style.display = 'block';
    if (btnToggle) btnToggle.classList.add('chatbot-hidden');
    scrollKeBawah();
  } else {
    kontainerChatbot.classList.add('chatbot-hidden');
    kontainerChatbot.style.display = 'none';
    if (btnToggle) btnToggle.classList.remove('chatbot-hidden');
  }
}

// ==================== KIRIM PESAN ====================

function kirimPesanPengguna() {
  const input = document.getElementById('input-chatbot');
  if (!input) return;
  
  const pesan = input.value.trim();
  if (!pesan) return;
  
  // Tampilkan pesan user
  tambahPesanPengguna(pesan);
  
  // Kirim ke server
  kirimPesanKeChatbot(pesan);
  
  // Clear input
  input.value = '';
}

function kirimPesanKeChatbot(pesan, papan = null, options = {}) {
  // Jangan kirim papan dari frontend - gunakan session backend yang lebih reliable
  // Backend akan ambil dari req.session.tekaTekiAktif
  // Namun untuk validasi langkah kita dapat mengirim papan saat ini agar server
  // dapat memvalidasi berdasarkan isian pemain yang sedang aktif.
  let papanSekarang = papan;
  if (!papanSekarang && typeof window.dapatkanPapanSekarang === 'function') {
    try { papanSekarang = window.dapatkanPapanSekarang(); } catch(e) { papanSekarang = null; }
  }
  // Coba dapatkan solusi dari frontend jika tersedia (berguna di environment tanpa session)
  let solusiSekarang = null;
  if (typeof window.dapatkanSolusiSekarang === 'function') {
    try { solusiSekarang = window.dapatkanSolusiSekarang(); } catch(e) { solusiSekarang = null; }
  }

  if (!soket) {
    // Fallback ke HTTP API - backend akan ambil dari session
    fetch('/api/chatbot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pesan, quick: !!options.quick, dataPuzzle: papanSekarang ? { papan: papanSekarang, solusi: solusiSekarang } : undefined })
    })
    .then(r => r.json())
    .then(data => tanganiResponsChatbot(data))
    .catch(err => {
      console.warn('HTTP chatbot error:', err);
      tambahPesanStatus('⚠️ Chatbot offline. Pastikan koneksi server aktif.');
    });
    return;
  }
  
  // Emit event ke server
  soket.emit('pesan_chatbot', {
    pesan: pesan,
    papan: papanSekarang,
    solusi: solusiSekarang,
    quick: !!options.quick
  });
  
  console.log('📤 Pesan dikirim:', pesan);
}

// ==================== SOCKET EVENTS ====================

function siapkanEventSoket() {
  const idxAwal = pilihPathAwal();
  const idxAlt = idxAwal === 0 ? 1 : 0;

  function ikatEvent(socketInstance, pathLabel) {
    socketInstance.on('connect', () => {
      console.log('✅ Socket.IO terhubung via', pathLabel);
      tambahPesanStatus('✅ Chatbot terhubung');
    });

    socketInstance.on('connect_error', (err) => {
      console.warn('⚠️ Gagal konek Socket.IO via', pathLabel, err?.message || err);
      if (!sudahCobaAlternate) {
        sudahCobaAlternate = true;
        console.log('🔄 Mencoba path alternatif');
        soket.removeAllListeners();
        soket.close();
        soket = buatSoket(socketPaths[idxAlt]);
        ikatEvent(soket, socketPaths[idxAlt]);
      } else {
        tambahPesanStatus('⚠️ Gagal konek ke chatbot. Coba lagi atau muat ulang.');
      }
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('⚠️ Socket.IO terputus', reason);
      tambahPesanStatus('⚠️ Koneksi chatbot terputus. Mencoba hubungkan kembali...');
    });

    socketInstance.on('respons_chatbot', (data) => {
      tanganiResponsChatbot(data);
    });
  }

  if (typeof io === 'undefined') {
    console.warn('Socket.IO tidak tersedia; chatbot offline');
    return;
  }

  soket = buatSoket(socketPaths[idxAwal]);
  ikatEvent(soket, socketPaths[idxAwal]);
}

// ==================== HANDLE RESPONS ====================

function tanganiResponsChatbot(data) {
  console.log('📥 Respons chatbot:', data);
  
  switch(data.tipe) {
    case 'hint':
      tanganiHint(data);
      break;
      
    case 'validasi':
      tanganiValidasi(data);
      break;
      
    case 'solusi':
      tanganiSolusi(data);
      break;
      
    case 'error':
      tambahPesanBot(`❌ ${data.pesan}`);
      break;
      
    default:
      tambahPesanBot(data.pesan);
  }
  
  // Auto scroll
  scrollKeBawah();
}

// Status helper agar tidak spam
let pesanStatusTerakhir = '';
function tambahPesanStatus(pesan) {
  if (pesanStatusTerakhir === pesan) return;
  pesanStatusTerakhir = pesan;
  tambahPesanBot(pesan);
}

// ==================== HANDLE HINT ====================

function tanganiHint(data) {
  if (data.data && data.data.sukses) {
    const { baris, kolom, angka, pesan } = data.data;
    
    // Tampilkan pesan
    tambahPesanBot(pesan);
    
    // Highlight sel di papan (opsional)
    const sel = document.querySelector(`[data-baris="${baris}"][data-kolom="${kolom}"]`);
    if (sel && !sel.readOnly) {
      sel.value = angka;
      sel.classList.add('diisi');
      sel.focus();
      
      // Update papan global
      if (typeof window.dapatkanPapanSekarang === 'function') {
        const papan = window.dapatkanPapanSekarang();
        papan[baris][kolom] = angka;
      }
    }
  } else {
    tambahPesanBot(data.pesan || '❌ Gagal mendapatkan hint');
  }
}

// ==================== HANDLE VALIDASI ====================

function tanganiValidasi(data) {
  if (data.data) {
    const hasil = data.data;
    
    if (hasil.valid && hasil.selesai) {
      tambahPesanBot(hasil.pesan);
      // Trigger selesai permainan
      if (typeof selesaiPermainan === 'function') {
        setTimeout(selesaiPermainan, 1000);
      }
    } else if (hasil.valid && !hasil.selesai) {
      tambahPesanBot(hasil.pesan);
    } else {
      // Ada kesalahan
      let pesanError = hasil.pesan;
      
      if (hasil.kesalahan && hasil.kesalahan.length > 0) {
        pesanError += '\n\nKesalahan ditemukan di:';
        hasil.kesalahan.slice(0, 3).forEach(err => {
          pesanError += `\n• Baris ${err.baris}, Kolom ${err.kolom}: ${err.nilaiPemain} → seharusnya ${err.nilaiBenar}`;
        });
        
        if (hasil.kesalahan.length > 3) {
          pesanError += `\n... dan ${hasil.kesalahan.length - 3} kesalahan lainnya`;
        }
      }
      
      tambahPesanBot(pesanError);
    }
  }
}

// ==================== HANDLE SOLUSI ====================

function tanganiSolusi(data) {
  if (data.data && data.data.solusi) {
    const solusi = data.data.solusi;
    
    tambahPesanBot(data.pesan);
    tambahPesanBot('⚠️ Menampilkan solusi akan menghentikan permainan dan skor tidak akan disimpan.');
    
    // Tandai bahwa solusi telah ditampilkan sehingga tidak boleh disubmit
    try { window.solusiDitampilkan = true; } catch(e) { /* ignore */ }

    // Update papan dengan solusi
    if (typeof window.updatePapan === 'function') {
      setTimeout(() => {
        window.updatePapan(solusi);
        tambahPesanBot('✅ Solusi ditampilkan!');
        
        // Hentikan timer
        if (typeof hentikanTimer === 'function') {
          hentikanTimer();
        }
      }, 1000);
    }
  }
}

// ==================== TAMBAH PESAN KE UI ====================

function tambahPesanPengguna(pesan) {
  const kontainerPesan = document.getElementById('chatbot-messages');
  if (!kontainerPesan) return;
  
  const div = document.createElement('div');
  div.className = 'pesan user';
  div.textContent = pesan;
  
  kontainerPesan.appendChild(div);
  scrollKeBawah();
}

function tambahPesanBot(pesan) {
  const kontainerPesan = document.getElementById('chatbot-messages');
  if (!kontainerPesan) return;
  
  const div = document.createElement('div');
  div.className = 'pesan bot';
  
  // Support multiline
  div.innerHTML = pesan.replace(/\n/g, '<br>');
  
  kontainerPesan.appendChild(div);
  scrollKeBawah();
}

function scrollKeBawah() {
  const kontainerPesan = document.getElementById('chatbot-messages');
  if (kontainerPesan) {
    kontainerPesan.scrollTop = kontainerPesan.scrollHeight;
  }
}

// ==================== EXPORT ====================

window.kirimPesanKeChatbot = kirimPesanKeChatbot;
window.alihChatbot = alihChatbot;
