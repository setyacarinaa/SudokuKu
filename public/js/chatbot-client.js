/**
 * chatbot-client.js
 * Frontend untuk Socket.IO chatbot
 */

// Inisialisasi Socket.IO
const socket = io();

// State chatbot
let chatbotTerbuka = false;

// ==================== INISIALISASI ====================

document.addEventListener('DOMContentLoaded', () => {
  console.log('💬 Chatbot client dimuat');
  
  setupChatbot();
  setupSocketEvents();
  // Toggle helpers
  const getChatbotContainer = () => document.querySelector('#chatbot-container');
  const getCloseBtn = () => document.querySelector('#chatbot-close, .chatbot-close');
  const getHeader = () => document.querySelector('#chatbot-header');

  const hideChatbot = () => {
    const container = getChatbotContainer();
    if (container) {
      container.classList.add('chatbot--hidden');
      container.style.display = 'none';
    }
  };

  const showChatbot = () => {
    const container = getChatbotContainer();
    if (container) {
      container.classList.remove('chatbot--hidden');
      container.style.display = 'block';
    }
  };

  // Existing toggle API, keep backward compatible
  window.toggleChatbot = function toggleChatbot(forceState) {
    const container = getChatbotContainer();
    if (!container) return;
    const isHidden = container.classList.contains('chatbot--hidden') || container.style.display === 'none';
    if (forceState === true) {
      showChatbot();
    } else if (forceState === false) {
      hideChatbot();
    } else {
      if (isHidden) showChatbot(); else hideChatbot();
    }
  };

  // Wire up close button (the "X")
  const closeBtn = getCloseBtn();
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      hideChatbot();
    });
  }

  // Also allow header double-click to collapse/expand
  const header = getHeader();
  if (header) {
    header.addEventListener('dblclick', () => {
      window.toggleChatbot();
    });
  }
});

// ==================== SETUP CHATBOT UI ====================

function setupChatbot() {
  // Tombol toggle chatbot
  const btnToggle = document.getElementById('chatbot-toggle');
  if (btnToggle) {
    btnToggle.addEventListener('click', toggleChatbot);
  }
  
  // Form input chatbot
  const formChatbot = document.getElementById('form-chatbot');
  if (formChatbot) {
    formChatbot.addEventListener('submit', (e) => {
      e.preventDefault();
      kirimPesan();
    });
  }
  
  // Tombol cepat
  const btnHint = document.getElementById('btn-hint-chat');
  if (btnHint) {
    btnHint.addEventListener('click', () => {
      kirimPesanChatbot('hint');
    });
  }
  
  // Pesan sambutan
  tambahPesanBot('👋 Halo! Saya chatbot SudokuKu. Ketik "cara main" untuk instruksi atau "hint" untuk bantuan!');
}

// ==================== TOGGLE CHATBOT ====================

function toggleChatbot() {
  const container = document.getElementById('chatbot-container');
  const btnToggle = document.getElementById('chatbot-toggle-btn');
  
  if (!container) return;
  
  chatbotTerbuka = !chatbotTerbuka;
  
  if (chatbotTerbuka) {
    container.classList.remove('chatbot-hidden');
    if (btnToggle) btnToggle.classList.add('chatbot-hidden');
    
    // Auto scroll ke bawah
    scrollKeBawah();
  } else {
    container.classList.add('chatbot-hidden');
    if (btnToggle) btnToggle.classList.remove('chatbot-hidden');
  }
}

// ==================== KIRIM PESAN ====================

function kirimPesan() {
  const input = document.getElementById('input-chatbot');
  if (!input) return;
  
  const pesan = input.value.trim();
  if (!pesan) return;
  
  // Tampilkan pesan user
  tambahPesanUser(pesan);
  
  // Kirim ke server
  kirimPesanChatbot(pesan);
  
  // Clear input
  input.value = '';
}

function kirimPesanChatbot(pesan, papan = null) {
  // Ambil papan saat ini jika tidak diberikan
  if (!papan && typeof window.dapatkanPapanSekarang === 'function') {
    papan = window.dapatkanPapanSekarang();
  }
  
  // Emit event ke server
  socket.emit('pesan_chatbot', {
    pesan: pesan,
    papan: papan
  });
  
  console.log('📤 Pesan dikirim:', pesan);
}

// ==================== SOCKET EVENTS ====================

function setupSocketEvents() {
  // Connection
  socket.on('connect', () => {
    console.log('✅ Socket.IO terhubung');
  });
  
  // Disconnect
  socket.on('disconnect', () => {
    console.log('⚠️ Socket.IO terputus');
    tambahPesanBot('⚠️ Koneksi terputus. Mencoba hubungkan kembali...');
  });
  
  // Respons dari chatbot
  socket.on('respons_chatbot', (data) => {
    handleResponsChatbot(data);
  });
}

// ==================== HANDLE RESPONS ====================

function handleResponsChatbot(data) {
  console.log('📥 Respons chatbot:', data);
  
  switch(data.tipe) {
    case 'hint':
      handleHint(data);
      break;
      
    case 'validasi':
      handleValidasi(data);
      break;
      
    case 'solusi':
      handleSolusi(data);
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

function handleHint(data) {
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

function handleValidasi(data) {
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

function handleSolusi(data) {
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

function tambahPesanUser(pesan) {
  const container = document.getElementById('chatbot-messages');
  if (!container) return;
  
  const div = document.createElement('div');
  div.className = 'pesan user';
  div.textContent = pesan;
  
  container.appendChild(div);
  scrollKeBawah();
}

function tambahPesanBot(pesan) {
  const container = document.getElementById('chatbot-messages');
  if (!container) return;
  
  const div = document.createElement('div');
  div.className = 'pesan bot';
  
  // Support multiline
  div.innerHTML = pesan.replace(/\n/g, '<br>');
  
  container.appendChild(div);
  scrollKeBawah();
}

function scrollKeBawah() {
  const container = document.getElementById('chatbot-messages');
  if (container) {
    container.scrollTop = container.scrollHeight;
  }
}

// ==================== EXPORT ====================

window.kirimPesanChatbot = kirimPesanChatbot;
window.toggleChatbot = toggleChatbot;
