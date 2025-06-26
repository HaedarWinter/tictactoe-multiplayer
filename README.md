# Game Multiplayer Online

Game multiplayer online untuk dua pemain dengan sistem kode room. Permainan yang disediakan adalah Tic-Tac-Toe (X dan O).

## Fitur

- Sistem room dengan kode unik
- Permainan Tic-Tac-Toe untuk dua pemain
- Komunikasi real-time menggunakan Socket.io
- Antarmuka yang responsif dengan Tailwind CSS
- Dapat dihosting di Vercel

## Teknologi yang Digunakan

- Next.js 14
- TypeScript
- Socket.io
- Tailwind CSS
- Vercel (untuk hosting)

## Cara Menjalankan Lokal

1. Clone repositori ini
2. Install dependensi:
   ```bash
   npm install
   ```
3. Jalankan server pengembangan:
   ```bash
   npm run dev
   ```
4. Buka [http://localhost:3000](http://localhost:3000) di browser Anda

## Cara Bermain

1. Buka halaman utama
2. Masukkan nama pemain
3. Pilih "Buat Room Baru" untuk membuat room baru
4. Bagikan kode room kepada teman Anda
5. Teman Anda dapat bergabung dengan memasukkan kode room dan namanya
6. Setelah dua pemain bergabung, host dapat memulai permainan
7. Bermain secara bergantian hingga ada pemenang atau seri
8. Pilih "Main Lagi" untuk memulai permainan baru

## Deployment ke Vercel

1. Fork repositori ini
2. Buat proyek baru di [Vercel](https://vercel.com)
3. Hubungkan dengan repositori GitHub Anda
4. Deploy!

## Lisensi

MIT 