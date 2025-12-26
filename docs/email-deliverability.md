# Panduan Deliverability Email (SPF, DKIM, verifikasi pengirim)

Dokumen singkat untuk menyiapkan dan memverifikasi pengiriman email produksi.

## 1. Konfigurasi DNS (SPF / DKIM / DMARC)

1. SPF
- Tambahkan TXT record pada DNS domain pengirim (misal: `example.com`) berisi sumber yang diizinkan mengirim email. Contoh untuk SendGrid:
  "v=spf1 include:sendgrid.net -all"
- Untuk SMTP (misal menggunakan Google Workspace) gunakan include sesuai provider.

2. DKIM
- Jika menggunakan provider transaksional (SendGrid, Mailgun, SES), aktifkan DKIM signing di dashboard provider.
- Provider akan memberikan 1-2 record TXT (selector). Tambahkan record tersebut di DNS.
- Contoh Nama record: `s1._domainkey.example.com` -> value: (panjang string dari provider).

3. DMARC (opsional tapi disarankan)
- Tambahkan TXT record `_dmarc.example.com` dengan policy singkat, contoh:
  "v=DMARC1; p=quarantine; rua=mailto:postmaster@example.com; ruf=mailto:postmaster@example.com; pct=100"

## 2. Verifikasi di Provider
- Untuk SendGrid / Mailgun / SES: ikuti wizard verifikasi domain di dashboard.
- Pastikan semua record DNS sudah terpropagasi (bisa butuh beberapa menit hingga 48 jam).

## 3. Environment variables yang wajib
- `EMAIL_USER`, `EMAIL_PASSWORD` (jika menggunakan SMTP)
- `EMAIL_HOST`, `EMAIL_PORT` (SMTP host/port)
- `SENDGRID_API_KEY` (jika menggunakan SendGrid API)
- `SENDGRID_FROM_EMAIL` (optional)
- `BASE_URL` (mis. https://app.example.com)
- `APP_NAME`, `SUPPORT_EMAIL` (opsional, untuk template)

## 4. Tes pengiriman & validasi
1. Test koneksi transporter (Nodemailer):

```bash
node -e "require('./src/services/emailService').testKoneksiEmail().then(console.log).catch(console.error)"
```

2. Kirim email percobaan melalui endpoint registrasi atau skrip cepat (curl / Postman).
3. Gunakan tools berikut untuk memeriksa kualitas deliverability:
- https://www.mail-tester.com (kirim ke alamat mail-tester dan lihat skor)
- Check headers di inbox (Received, DKIM-Signature, SPF pass)

### Script pemeriksaan DNS (Windows PowerShell)

Saya sertakan skrip sederhana `scripts/check-dns.ps1` yang dapat menjalankan pengecekan TXT untuk SPF, DKIM (selector), dan DMARC pada Windows.

Contoh penggunaan (PowerShell):

```powershell
.\scripts\check-dns.ps1 -Domain "example.com" -DkimSelectors @('s1','s2')
```

Script ini membantu cepat memeriksa apakah record DNS yang diperlukan sudah ada. Untuk Linux/macOS gunakan `dig txt <name>`.

## 5. Tips praktik terbaik
- Gunakan alamat `no-reply@yourdomain.com` atau `support@yourdomain.com` yang diverifikasi.
- Jangan gunakan alamat free-mail (gmail.com) sebagai `from` ketika mengirim dari domain Anda.
- Aktifkan bounce/webhook pada provider untuk menindaklanjuti email yang gagal.
- Jika volume tinggi, gunakan queue (Redis/RabbitMQ) dan worker terpisah.

## 6. Troubleshooting singkat
- SPF fail: periksa record TXT dan gunakan `dig txt example.com` untuk validasi.
- DKIM fail: periksa selector name dan value persis.
- Email masuk spam: periksa konten (remove excessive links, images), gunakan proper subject, sertakan text/plain fallback.

---
Dokumen ini cukup untuk langkah awal konfigurasi deliverability. Jika Anda ingin, saya bisa:
- Membuat skrip `verify-dns.sh` untuk memeriksa record SPF/DKIM (simple dig commands), atau
- Membantu menyiapkan webhook bounce pada provider (SendGrid/Mailgun) di kode Anda.
