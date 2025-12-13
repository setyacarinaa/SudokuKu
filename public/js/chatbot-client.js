/**
 * chatbot-client.js
 * Frontend untuk Socket.IO chatbot
 */

// Inisialisasi Socket.IO
const soket = io();

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
      kirimPesanKeChatbot('hint');
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

function kirimPesanKeChatbot(pesan, papan = null) {
  // Ambil papan saat ini jika tidak diberikan
  if (!papan && typeof window.dapatkanPapanSekarang === 'function') {
    papan = window.dapatkanPapanSekarang();
  }
  
  // Emit event ke server
  soket.emit('pesan_chatbot', {
    pesan: pesan,
    papan: papan
  });
  
  console.log('📤 Pesan dikirim:', pesan);
}

// ==================== SOCKET EVENTS ====================

function siapkanEventSoket() {
  // Connection
  soket.on('connect', () => {
    console.log('✅ Socket.IO terhubung');
  });
  
  // Disconnect
  soket.on('disconnect', () => {
    console.log('⚠️ Socket.IO terputus');
    tambahPesanBot('⚠️ Koneksi terputus. Mencoba hubungkan kembali...');
  });
  
  // Respons dari chatbot
  soket.on('respons_chatbot', (data) => {
    tanganiResponsChatbot(data);
  });
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
