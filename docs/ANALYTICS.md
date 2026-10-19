# Dokumentasi Sistem Analitik & Telemetri Hybrid

## 1. Arsitektur

Sistem menggunakan model hybrid:
- **Internal Database (FastAPI + Supabase/Postgres)**: Mencatat page view agregat tahan ad-blocker, sumber referer, dan total view untuk dashboard admin & badge statistik publik.
- **External Behavioral (PostHog SDK)**: Opsional untuk behavioral analytics (session replay, heatmap, conversion funnel) tanpa membebani penyimpanan database utama.

```
Pengunjung Navigasi
        │
        ▼
[AnalyticsTracker] (Next.js Client)
   ├───> POST /api/analytics/view ────> [FastAPI Router]
   │     (sendBeacon / keepalive)          ├── Anonymize IP (SHA-256 + Salt)
   │                                       ├── Debounce 30-min per path
   │                                       └── Insert ke tabel `page_views`
   │
   └───> PostHog (Opsional jika NEXT_PUBLIC_POSTHOG_KEY terpasang)
```

---

## 2. Model Database (`page_views`)

| Kolom | Tipe | Deskripsi |
| :--- | :--- | :--- |
| `id` | Integer (PK) | Auto increment identifier |
| `path` | String(255) | Rute halaman (misal: `/`, `/projects`, `/blog/foo`) |
| `visitor_hash` | String(64) | SHA-256 dari `SECRET_KEY:IP:UA:YYYY-MM-DD` |
| `referrer` | String(500) | Sumber rujukan pengunjung (LinkedIn, GitHub, dll.) |
| `user_agent` | String(255) | Ringkasan browser/device |
| `created_at` | DateTime (TZ) | Waktu kunjungan (default `now()`) |

---

## 3. Endpoints API

### Public Endpoints:
- `POST /analytics/view`
  - Body: `{ "path": "/projects", "referrer": "https://github.com" }`
  - Response: `{"status": "recorded"}` atau `{"status": "debounced"}`
- `GET /analytics/stats?path=/projects`
  - Response: `{ "path": "/projects", "total_views": 150, "unique_visitors": 42 }`

### Protected Admin Endpoints:
- `GET /analytics/summary` (Requires Superuser Bearer Token)
  - Response:
    ```json
    {
      "total_views": 1250,
      "today_views": 45,
      "unique_visitors_today": 28,
      "top_pages": [
        { "path": "/", "total_views": 620, "unique_visitors": 180 },
        { "path": "/projects", "total_views": 310, "unique_visitors": 95 }
      ],
      "top_referrers": [
        { "referrer": "https://linkedin.com/", "count": 120 },
        { "referrer": "https://github.com/", "count": 85 }
      ]
    }
    ```

---

## 4. Konfigurasi Lingkungan (`.env`)

```env
# Frontend
NEXT_PUBLIC_API_URL=http://localhost/api
NEXT_PUBLIC_POSTHOG_KEY=phc_...  # Opsional (kosongkan jika tidak memakai PostHog)
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com # Opsional
```

---

## 5. Cara Menjalankan Migrasi Database

```bash
cd server
alembic upgrade head
```
