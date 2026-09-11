# Session Status & Handoff — Jenni Khoe MUA Project

> **BACA FILE INI SEBELUM MEMULAI SESI BARU.**
> Berisi status arsitektur aktif, kredensial, progress, dan petunjuk untuk agent berikutnya.

---

## 1. Status Arsitektur Aktif (Per 2026-09-11)

| Komponen | Status & Provider | Detail |
|----------|-------------------|--------|
| **Arsitektur** | **Full Serverless** | Migrasi dari Laravel 11/MySQL ke Next.js 15 + Supabase |
| **Frontend & API** | Next.js 15 App Router | Hosted di Vercel (`jenni-khoe-mua.vercel.app`) |
| **Database** | Supabase PostgreSQL 17 | Project `Jenni Khoe MUA` (`yegyiqyqtcbvjjqxvyto`, Singapore `ap-southeast-1`) |
| **Auth** | Supabase Auth | Admin: `admin@jennikhoe.com`, endpoint `/api/login` & middleware verifikasi JWT |
| **Storage** | Supabase Storage | Penyimpanan gambar & tanda tangan digital SPK |
| **AI Assistant** | Groq Cloud SDK | Model `llama-3.3-70b-versatile` via `/api/chat` |
| **Root Vercel** | `rootDirectory: "frontend"` | Auto-build Next.js pada branch `main` |

---

## 2. Kredensial & Secrets

Semua kredensial rahasia tersimpan di file lokal `.workspace.env` (dijaga oleh `.gitignore`):
- `GITHUB_TOKEN` — Token push ke repo `Albertensen/Jenni-Khoe-Web`
- `VERCEL_TOKEN` — Token API Vercel project `jenni-khoe-mua`
- `SUPABASE_ACCESS_TOKEN` — Supabase Personal Access Token
- `SUPABASE_PROJECT_ID` — `yegyiqyqtcbvjjqxvyto`
- `NEXT_PUBLIC_SUPABASE_URL` — `https://yegyiqyqtcbvjjqxvyto.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Anon public key Supabase
- `SUPABASE_SERVICE_ROLE_KEY` — Service role key Supabase

---

## 3. Database Schema (10 Tabel Terpasang di Supabase)

Skema DDL tersimpan di `supabase_schema.sql` dan telah aktif di Supabase:
1. `clients` — Data klien makeup
2. `bookings` — Data booking & state machine
3. `quotations` — Penawaran harga & rincian paket
4. `contracts` — SPK & tanda tangan digital
5. `payments` — Data transaksi payment gateway
6. `schedules` — Slot jadwal & Google Calendar sync
7. `inquiries` — Form konsultasi tanggal
8. `ai_leads` — Lead capture dari chatbot
9. `portfolio_items` — Galeri riasan
10. `gated_tokens` — Akses halaman private

---

## 4. Status Halaman & Rute

| Halaman / Rute | Status |
|----------------|--------|
| `/` (Landing Page) | Live di Vercel, responsive, luxury theme |
| `/login` (Admin Login) | Live di Vercel, Supabase Auth (`admin@jennikhoe.com` / `admin123`) |
| `/admin` (Dashboard) | Terproteksi `src/middleware.ts` via token Supabase |
| `/admin/*` (Sub-modul) | Komponen UI siap, menunggu integrasi query Supabase |
| `/api/login` | HTTP 200 terverifikasi live di production |
| `/api/logout` | Clear cookie & redirect |
| `/api/chat` | AI Chatbot live via Groq API |
| `/g/[token]` | Gated route untuk invoice / SPK |

---

## 5. Panduan untuk Agent Berikutnya

1. **JANGAN mencoba menjalankan atau menghubungkan Laravel lagi.** Arsitektur sudah 100% pindah ke Next.js Route Handlers + Supabase.
2. Untuk membaca/menulis data ke database di frontend/API, gunakan:
   ```typescript
   import { supabase, getServiceSupabase } from "@/lib/supabase";
   ```
3. Setiap selesai pengerjaan fitur:
   - Jalankan audit build: `cd frontend && npm run build`
   - Catat di `CHANGELOG.md`
   - Git commit atomik (`git add <files>`)
   - Git push ke `origin main`
   - Vercel otomatis deploy perubahan
