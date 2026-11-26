# SOTKI Badminton Tracker

Aplikasi Next.js App Router dengan TypeScript, Tailwind CSS, dan SQLite. Fase pertama menampilkan halaman awal dan menyiapkan migration untuk fase berikutnya.

## Development lokal

Gunakan Node.js 22 LTS (22.13 atau lebih baru) dan npm. Dari root repository pada macOS/Linux:

```sh
cp .env.example .env
npm ci
npm run db:migrate
npm run dev
```

Buka http://localhost:3000. Jika binary SQLite perlu dikompilasi saat instalasi, siapkan Python 3, make, dan compiler C++. Untuk memeriksa build produksi, jalankan `npm run build`.

## Konfigurasi

`DATABASE_PATH` menentukan lokasi file SQLite lokal. Direktori induk dibuat otomatis. Gunakan file `.env` untuk konfigurasi bersama aplikasi dan Drizzle Kit. Aplikasi menggunakan zona waktu Asia/Jakarta. Untuk port development lain gunakan `npm run dev -- --port 3001`. Dalam Compose, `PORT` mengatur port host.

## Database dan migration

Halaman berada di `src/app`. Impor koneksi `src/db/index.ts` hanya dari kode server dengan runtime Node.js. Schema di `src/db/schema.ts` masih kosong.

Saat menambahkan tabel pada fase berikutnya:

```sh
npm run db:generate
npm run db:migrate
```

Periksa SQL yang dihasilkan dan commit folder `drizzle/` bersama perubahan schema. Perintah migrate menerapkan migration yang tertunda.

## Docker Compose

```sh
docker compose up --build -d
docker compose logs -f app
```

Buka http://localhost:3000 atau port host yang diatur. Satu container menjalankan migration sebelum memulai aplikasi. File SQLite disimpan pada named volume `badminton_data` di `/app/data`. Untuk menghentikan aplikasi sambil mempertahankan data, jalankan `docker compose down`.

## Login

Isi `SOTKI_ACCESS_CODE` pada `.env` dengan kode enam digit sebelum menjalankan aplikasi. Untuk produksi, gunakan HTTPS agar browser dapat mengirim cookie Secure. Session berlaku 30 hari dan tersimpan di subdirektori `sessions/` pada volume data.
