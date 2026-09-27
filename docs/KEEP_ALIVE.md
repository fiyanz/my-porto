# Panduan Keep-Alive: Render & Supabase

Dokumen ini menjelaskan cara menjaga agar backend **Render** dan database **Supabase** tetap aktif dan terhindar dari auto-suspend / sleep.

---

## 1. Memahami Masalah & Aturan Inaktivitas

| Platform | Kebijakan Free Tier | Dampak jika Terjadi |
| :--- | :--- | :--- |
| **Render** | Auto-suspend / sleep setelah **15 menit** tidak ada traffic HTTP masuk. | Cold-start memakan waktu **50+ detik** saat pengunjung membuka website, menyebabkan loading awal sangat lambat. |
| **Supabase** | Auto-pause database setelah **7 hari** tanpa aktivitas query database Postgres. | Database berhenti total; aplikasi error dan harus di-unpause manual di dashboard Supabase. |

---

## 2. Solusi: Endpoint `/health` dengan Database Ping

Backend kini memiliki endpoint khusus di:
```text
GET https://<nama-backend>.onrender.com/health
```

Respons saat normal:
```json
{
  "status": "healthy",
  "database": "connected"
}
```

### Mengapa ini menyelesaikan kedua masalah sekaligus?
1. **Render**: Menerima request HTTP berkala $\rightarrow$ Timer inaktivitas 15 menit otomatis di-reset $\rightarrow$ Render **tidak pernah sleep**.
2. **Supabase**: Setiap request `/health` mengeksekusi query database SQL ringan (`SELECT 1`) $\rightarrow$ Timer inaktivitas 7 hari di-reset $\rightarrow$ Supabase **tidak pernah terpause**.

> [!NOTE]
> **Catatan Kuota Render Free Tier:**
> Render memberikan **750 free instance hours** per bulan.
> Dalam 1 bulan (31 hari x 24 jam = 744 jam), 1 backend web service yang menyala 24/7 hanya memakai ~744 jam (masih di bawah kuota 750 jam).
> *Pastikan Anda tidak memiliki web service free tier lain yang aktif di akun Render yang sama agar kuota tidak terbagi.*

---

## 3. Khusus Supabase: Jika Saat Ini SUDAH Terlanjur "Paused"

> [!IMPORTANT]
> Jika status database Supabase Anda di dashboard saat ini sudah berstatus **Paused**:
> Pinger eksternal **tidak bisa** membangunkannya secara otomatis karena database memutus semua koneksi masuk.
> 
> **Langkah yang harus dilakukan (Cukup 1 kali):**
> 1. Buka [Supabase Dashboard](https://supabase.com/dashboard).
> 2. Klik project Anda.
> 3. Klik tombol hijau **"Restore project"** / **"Resume project"**.
> 4. Tunggu ~1-2 menit hingga status berubah kembali menjadi **Active**.
> 5. Setelah berstatus Active, sistem `/health` pinger akan menjaganya agar **tidak akan pernah terpause lagi**.

---

## 4. Cara Setup External Pinger

Agar backend dipanggil secara otomatis setiap beberapa menit dari cloud, gunakan salah satu layanan pinger gratis di bawah ini:

### Opsi A: Menggunakan cron-job.org (Sangat Direkomendasikan ⭐)
Layanan ini 100% gratis, tanpa batas durasi, dan memungkinkan Anda menentukan jadwal fleksibel.

1. Buka dan daftar akun gratis di [cron-job.org](https://cron-job.org/).
2. Masuk ke dashboard dan klik **"Create Cronjob"**.
3. Isi form berikut:
   - **Title**: `Portfolio Backend Keep-Alive`
   - **URL**: `https://<nama-backend>.onrender.com/health` *(Ganti dengan URL backend Render Anda)*
   - **Execution Schedule**:
     - Pilih **"Every 12 minutes"** (atau antara **10 s/d 14 menit**).
     - *Catatan: Jangan lebih dari 14 menit karena Render sleep di menit ke-15.*
   - **Request Method**: `GET`
   - **Request Timeout**: `30 seconds` (berguna jika sedang cold start pertama kali).
4. Di tab **Notifications**, aktifkan centang pengiriman email jika cronjob gagal dijalankan (berguna sebagai uptime monitor).
5. Klik **"Create"**.

---

### Opsi B: Menggunakan UptimeRobot (Alternatif Populer)
Layanan uptime monitor gratis yang memanggil URL setiap 5 menit.

1. Buka dan daftar di [uptimerobot.com](https://uptimerobot.com/).
2. Klik **"+ Add New Monitor"**.
3. Konfigurasi:
   - **Monitor Type**: `HTTP(s)`
   - **Friendly Name**: `Render Backend Health`
   - **URL (or IP)**: `https://<nama-backend>.onrender.com/health`
   - **Monitoring Interval**: `5 minutes` (standar gratis UptimeRobot)
4. Centang kontak notifikasi email Anda.
5. Klik **"Create Monitor"**.

---

## 5. Jaring Pengaman Cadangan

Proyek ini telah dilengkapi 2 lapisan pengaman cadangan:

### Cadangan 1: GitHub Actions Terjadwal (`.github/workflows/supabase-keep-alive.yml`)
Workflow ini berjalan otomatis setiap **3 hari sekali** pada pukul 00:00 UTC (hanya menggunakan ~10 menit/bulan dari kuota gratis 2.000 menit GitHub Actions).

Untuk mengaktifkannya:
1. Buka repo GitHub Anda $\rightarrow$ **Settings** $\rightarrow$ **Secrets and variables** $\rightarrow$ **Actions**.
2. Tambahkan **Repository secrets**:
   - `SUPABASE_URL`: Contoh `https://xxxx.supabase.co`
   - `SUPABASE_ANON_KEY`: Kunci anon/public Supabase Anda
   - `RENDER_BACKEND_URL`: Contoh `https://portofolio-backend.onrender.com` (opsional)

### Cadangan 2: Vercel Cron (`frontend/vercel.json`)
- Endpoint Next.js: `/api/keep-alive` di `frontend/src/app/api/keep-alive/route.ts`
- Jadwal Vercel Cron: berjalan 1 kali per hari (`0 0 * * *`)
- Memanggil backend `/health` dari Next.js setiap hari untuk memastikan Supabase tetap menerima aktivitas.

---

## 6. Pengujian & Verifikasi Lokal

Anda dapat menguji endpoint `/health` secara lokal sebelum deploy:

```bash
# Menjalankan server backend
cd server
uv run uvicorn app.main:app --port 8000

# Di terminal lain, uji endpoint
curl http://localhost:8000/health
```

Hasil yang diharapkan:
```json
{"status":"healthy","database":"connected"}
```
