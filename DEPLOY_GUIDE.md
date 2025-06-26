# Panduan Deploy Game Tic-Tac-Toe Multiplayer

## Langkah 1: Upload ke GitHub

1. Buka [GitHub](https://github.com) dan login
2. Klik tombol "New" untuk membuat repositori baru
3. Beri nama repositori (misalnya "tictactoe-multiplayer")
4. Biarkan repositori sebagai Public
5. Klik "Create repository"
6. Ikuti instruksi di halaman untuk push kode dari repositori lokal:

```bash
git remote add origin https://github.com/USERNAME/NAMA-REPOSITORI.git
git branch -M main
git push -u origin main
```

## Langkah 2: Deploy ke Vercel

1. Buka [Vercel](https://vercel.com) dan login (bisa menggunakan akun GitHub)
2. Klik "Add New..." > "Project"
3. Hubungkan dengan akun GitHub Anda
4. Pilih repositori yang baru saja Anda buat
5. Konfigurasi project:
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: next build
   - Output Directory: .next
   - Install Command: npm install

6. Tambahkan Environment Variables (jika diperlukan):
   - NEXT_PUBLIC_SOCKET_URL: https://${VERCEL_URL}

7. Klik "Deploy"

## Keuntungan Deploy di Vercel

1. **HTTPS secara otomatis** - Semua koneksi aman tanpa konfigurasi tambahan
2. **WebSocket Support** - Vercel mendukung WebSocket yang diperlukan untuk Socket.io
3. **Skalabilitas** - Dapat menangani banyak pemain secara bersamaan
4. **Global CDN** - Konten statis disampaikan dengan cepat di seluruh dunia
5. **Mudah di-deploy** - Cukup hubungkan dengan GitHub dan deploy otomatis

## Cara Bermain Online

Setelah di-deploy ke Vercel, aplikasi Anda akan:

1. Memiliki HTTPS secara otomatis
2. Tersedia secara online dengan URL `https://nama-project.vercel.app`
3. Dapat diakses oleh siapa saja di internet

Untuk bermain online dengan orang lain:
1. Host membuat room dengan mengakses URL aplikasi
2. Host mendapatkan kode room (misalnya: `ABC123`)
3. Host membagikan URL dengan kode room kepada pemain lain (misalnya: `https://nama-project.vercel.app/game/ABC123`)
4. Pemain lain mengklik link tersebut dan bergabung ke room

## Troubleshooting

Jika mengalami masalah dengan WebSocket di Vercel:

1. Pastikan konfigurasi `vercel.json` sudah benar:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "env": {
    "NEXT_PUBLIC_SOCKET_URL": "https://${VERCEL_URL}"
  },
  "rewrites": [
    {
      "source": "/socket.io/(.*)",
      "destination": "/api/socket"
    }
  ]
}
```

2. Pastikan Socket.io client menggunakan URL yang benar:
```typescript
const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || '';
socket = io(socketUrl, {
  path: '/api/socket',
  // ...konfigurasi lainnya
});
``` 