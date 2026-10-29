# Media Madrasah

Website majalah digital berbasis React, TypeScript, Vite, Supabase, dan Vercel. UI katalog, halaman editorial, dan palet merah yang sudah ada dipertahankan. Semua data publikasi dimuat dari API; tidak ada data majalah contoh.

## Prasyarat

- Node.js 22.13 atau lebih baru (versi proyek dicatat di `.nvmrc`)
- Akun Supabase dan Vercel
- npm

## Supabase

1. Buat proyek Supabase.
2. Jalankan SQL di `supabase/migrations/20261029000000_initial_schema.sql` melalui SQL Editor Supabase. Migrasi membuat tabel, indeks, trigger waktu pembaruan, pembatas percobaan login persisten, RLS/grant, dan bucket privat `magazine-pdfs`.
3. Bucket disetel privat, menerima `application/pdf`, dan memiliki batas 50 MiB. Pastikan paket/proyek Supabase Anda mendukung batas tersebut sebelum menerima unggahan produksi; bila tidak, turunkan `MAX_PDF_SIZE_BYTES` dan `file_size_limit` bersama-sama.
4. Pastikan Storage CORS mengizinkan origin lokal dan origin aplikasi produksi bila konfigurasi proyek Anda membatasi permintaan browser lintas origin.
5. Jalankan pemeriksaan hak akses `supabase/tests/rls.sql` sebagai pemilik proyek. Browser tidak diberi hak langsung ke tabel; endpoint menggunakan Supabase secret server-side.

## Environment lokal

Salin `.env.example` menjadi `.env.local`, lalu isi nilainya:

| Variabel | Penggunaan |
|---|---|
| `SUPABASE_URL` | URL proyek, digunakan server |
| `SUPABASE_SECRET_KEY` | Kunci secret/service-role server saja; jangan beri awalan `VITE_` |
| `ADMIN_USERNAME` | Username tunggal admin; perbandingan case-sensitive setelah trim |
| `ADMIN_PASSWORD_HASH` | Hash Argon2id, bukan password plaintext |
| `SESSION_SECRET` | Rahasia acak minimal 32 byte untuk sesi dan tiket upload |
| `APP_ORIGIN` | Origin aplikasi persis, misalnya `http://localhost:3000` |
| `API_PORT` | Port API lokal, default `3001` |
| `VITE_SUPABASE_URL` | URL proyek untuk SDK Storage browser |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Kunci publishable/anon; hanya digunakan dengan tiket upload bertanda tangan |

Buat hash password admin baru dengan prompt tersembunyi:

```bash
npx tsx scripts/create-admin-hash.ts
```

Masukkan hasil `ADMIN_PASSWORD_HASH=...` ke environment secret lokal/Vercel. Jangan menaruh hash, password, `SUPABASE_SECRET_KEY`, atau `SESSION_SECRET` dalam Git atau awalan `VITE_`. Buat rahasia sesi terpisah dari password, misalnya dengan `openssl rand -base64 48`.

## Menjalankan dan menguji

```bash
npm install
npm run dev
```

Vite berjalan di `http://localhost:3000`, dan API lokal di port `3001`; Vite meneruskan `/api/*` ke server tersebut. Aplikasi dapat dibuka tanpa kredensial, tetapi permintaan data akan memberi error konfigurasi yang jelas sampai `.env.local` diisi.

```bash
npm run lint
npm test
npm run build
```

## API dan akses

- `GET /api/public/magazines`: hanya terbitan publik, pencarian/filter, paginasi maksimal 24 item.
- `GET /api/public/magazines/:id`: metadata terbitan yang sudah dipublikasikan.
- `GET /api/public/magazines/slug/:slug`: pencarian metadata berdasarkan slug untuk rute pembaca frontend.
- `GET /api/public/magazines/:id/file-url`: URL bertanda tangan 1 jam hanya untuk terbitan publik.
- `POST /api/admin/login`, `POST /api/admin/logout`, `GET /api/admin/session`.
- `GET /api/admin/magazines`, `GET /api/admin/stats`.
- `POST /api/admin/uploads`, `DELETE /api/admin/uploads`, `POST /api/admin/magazines`, `PATCH /api/admin/magazines/:id`, `DELETE /api/admin/magazines/:id`.

Cookie sesi berumur 6 jam, `HttpOnly`, `SameSite=Lax`, dan `Secure` di Vercel. Percobaan login dibatasi pada database per hash IP. Semua mutasi admin memeriksa sesi dan origin. Slug dibuat dari judul; slug duplikat menghasilkan `409` dan tidak menimpa publikasi lain. Waktu `published_at` dipertahankan saat publikasi ditarik.

### Upload PDF dan batas Vercel

Vercel Functions membatasi ukuran request yang diproses langsung. Karena itu PDF tidak dikirim melalui body Function: API yang terautentikasi membuat object key acak dan tiket upload berdurasi terbatas, browser mengunggah langsung ke bucket privat melalui tiket tersebut, lalu API memeriksa metadata objek dan tanda tangan `%PDF-` sebelum menyimpan metadata publikasi. Secret Supabase tetap server-only; kunci publishable browser tidak dapat membaca/menulis tabel.

Upload dibatasi 50 MiB di aplikasi dan bucket. Ini perlu disesuaikan bersama-sama dengan batas paket Supabase. Jika tab ditutup di tengah unggahan, objek yang belum memiliki metadata dapat tertinggal di bucket privat; proses gagal normal mencoba membersihkannya dan pengelola perlu meninjau objek yatim secara berkala.

## Deployment Vercel

1. Hubungkan folder proyek ini ke Vercel. `vercel.json` mengatur build `npm run build`, output `dist`, dan fallback rute SPA tanpa menulis ulang `/api/*`.
2. Pilih Node.js 22.x atau lebih baru (minimal 22.13), lalu set semua environment variable di atas pada Development, Preview, dan Production sesuai kebutuhan.
3. Gunakan `APP_ORIGIN` persis sesuai URL deployment. `VITE_SUPABASE_URL` dan `VITE_SUPABASE_PUBLISHABLE_KEY` adalah konfigurasi publik build-time; tiga secret server tidak boleh memakai awalan `VITE_`.
4. Deploy Preview dan uji `/`, `/majalah`, `/majalah/:slug`, `/admin`, `/admin/dashboard`, serta endpoint API sebelum mempromosikan ke Production.
5. Domain `.my.id` belum diperlukan. Setelah domain tersedia, perbarui `APP_ORIGIN`, izinkan origin Storage bila diperlukan, dan deploy ulang.

## Checklist uji rilis

- [ ] Login benar memberi cookie sesi; username/password salah memberi pesan generik.
- [ ] Percobaan login berulang menghasilkan `429`; logout menghapus sesi.
- [ ] API admin tanpa sesi atau dengan sesi tidak valid menolak permintaan.
- [ ] API publik tidak menampilkan draf; URL PDF draf tidak dapat diterbitkan.
- [ ] Uji PDF valid, file kosong, nama/MIME salah, file non-PDF yang diganti ekstensi, file >50 MiB, serta slug duplikat.
- [ ] Uji tambah, edit, publish, unpublish, dan hapus; pastikan kegagalan Storage tidak dilaporkan sebagai sukses.
- [ ] Katalog kosong, filter/pencarian/paginasi, error/retry, dan reader multi-halaman bekerja.
- [ ] Jalankan `supabase/tests/rls.sql`, `npm run lint`, `npm test`, dan `npm run build`.

Rilis/deployment belum dapat diverifikasi dari workspace ini karena kredensial dan proyek Supabase/Vercel belum disediakan. Jangan memasukkan kredensial tersebut ke source code atau prompt.
# mgd
