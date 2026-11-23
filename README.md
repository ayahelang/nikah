# Nikah SaaS — Undangan Digital Custom

Layanan undangan pernikahan digital berbasis **GitHub Pages + Google Apps Script + Google Sheets**.

Domain: `nikah.silverhawk.web.id`

## Fitur yang Tersedia

### Untuk Admin
- Login dengan password yang disimpan di **Script Properties** (tidak ada di GitHub)
- Buat / edit / hapus akun pelanggan (username + password + paket + status)
- Lihat daftar semua pelanggan

### Untuk Pelanggan (setelah bayar & login)
- Login di `/login.html`
- Akses **Dapur Undangan** di `/{username}/dapur` (atau `/dapur.html` setelah login)
- Edit data undangan:
  - Nama mempelai, tanggal, waktu, lokasi, Maps
  - Cover image, musik, tema
  - Love Story (JSON)
  - Gallery foto (array URL)
  - Rekening / e-wallet (JSON)
  - Link live streaming
- Lihat daftar RSVP & ucapan tamu
- Link undangan: `https://nikah.silverhawk.web.id/{username}`

### Untuk Tamu
- Buka `https://nikah.silverhawk.web.id/{username}`
- Nama personal: tambahkan `?kpd=Bapak+Budi` → sambutan menyertakan nama
- Countdown, detail acara, story, gallery, rekening, RSVP + ucapan
- Musik background (jika diisi)

### Paket (contoh di landing)
| Paket     | Harga     | Fitur utama                          |
|-----------|-----------|--------------------------------------|
| Basic     | Rp 49.000 | RSVP, Maps, Countdown, nama tamu     |
| Standard  | Rp 79.000 | + Musik, Gallery, Rekening, Story    |
| Premium   | Rp 119.000| + Custom, Streaming, prioritas       |

---

## Setup dari Nol (Langkah demi Langkah)

### 1. Google Sheet + Apps Script

1. Buka [Google Sheets](https://sheets.google.com) → buat spreadsheet baru (misal: `Nikah SaaS DB`).
2. **Extensions → Apps Script**.
3. Hapus kode default, paste seluruh isi file `apps-script/Code.gs`.
4. Simpan project (Ctrl+S).
5. Jalankan fungsi **`setupSheets`** sekali (pilih di dropdown → Run).  
   Izinkan permission saat diminta.
6. Set password admin:
   - Project Settings (ikon gear) → **Script Properties** → Add
   - Key: `ADMIN_PASSWORD`
   - Value: password rahasia Anda (contoh: `AdminNikah2026!`)
7. **Deploy → New deployment**:
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Deploy → copy **Web App URL** (bentuk `https://script.google.com/macros/s/....../exec`)

### 2. Frontend (GitHub Pages)

1. Clone / download folder ini ke repo `nikah` (atau repo baru).
2. Edit `js/config.js`:
   ```js
   API_URL: 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec',
   ```
3. Pastikan file `CNAME` berisi: `nikah.silverhawk.web.id`
4. Push ke GitHub → Settings → Pages → Source: Deploy from branch `main` / root.
5. Tunggu beberapa menit hingga domain aktif.

### 3. Uji Coba

1. Buka `https://nikah.silverhawk.web.id/admin/`
2. Login dengan password yang Anda set di Script Properties.
3. Buat user contoh: username `tantri`, password `rahasia123`, paket Standard, status Active.
4. Buka `https://nikah.silverhawk.web.id/login.html` → login sebagai `tantri`.
5. Isi data di Dapur → Simpan.
6. Buka `https://nikah.silverhawk.web.id/tantri` (atau `.../undangan.html?u=tantri`).
7. Coba dengan nama tamu: `.../tantri?kpd=Bapak+Budi`.

---

## Struktur Folder

```
nikah-saas/
├── index.html          → Landing page + paket harga
├── login.html          → Login pelanggan
├── dapur.html          → Panel edit undangan (Dapur)
├── undangan.html       → Halaman undangan dinamis
├── 404.html            → Router path /{username}
├── admin/
│   └── index.html      → Panel admin
├── js/
│   ├── config.js       → API_URL (wajib diisi)
│   ├── api.js
│   └── auth.js
├── apps-script/
│   └── Code.gs         → Backend CRUD lengkap
├── CNAME
└── README.md
```

## Catatan Routing di GitHub Pages

- Path `/{username}` ditangani oleh `404.html` → redirect ke `undangan.html?u={username}`.
- Path `/{username}/dapur` saat ini diarahkan ke `/dapur.html` (session sudah menyimpan username).
- Setelah login, pelanggan selalu diarahkan ke dapur dengan username yang benar.

## Keamanan

- Password admin **hanya** di Script Properties (tidak pernah di-commit ke GitHub).
- Password pelanggan disimpan di Sheet (saat production bisa di-hash).
- Token session sederhana (base64 + expiry 7 hari). Untuk production bisa ditingkatkan.

## Pengembangan Selanjutnya (opsional)

- Hash password (Utilities.computeDigest)
- Upload gambar via Google Drive API
- Generate short link `/s/{code}` untuk tamu
- Statistik kunjungan
- Multiple tema CSS yang lebih kaya
- Export undangan ke PDF / gambar

---

**Dibuat untuk Silverhawk Network** · nikah.silverhawk.web.id
