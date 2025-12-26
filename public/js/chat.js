// public/js/chat.js
// Minimal Socket.IO client to send user messages and receive AI responses

document.addEventListener('DOMContentLoaded', () => {
  if (typeof io === 'undefined') return console.warn('Socket.IO client library not loaded');

  const socket = io({ path: '/socket.io' });

  socket.on('connect', () => console.log('✅ Terhubung ke server lewat Socket.IO'));

  socket.on('pesan', (data) => {
    console.log(`📩 [${data.username}] ${data.text}`);
    // Integrasikan dengan UI jika diinginkan; saat ini hanya dicatat di konsol
  });

  // Example: bind form if present
  const form = document.querySelector('#chat-form');
  if (form) {
    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const input = form.elements['message'];
      if (!input || !input.value) return;
      socket.emit('kirimPesan', input.value);
      input.value = '';
    });
  }
});
