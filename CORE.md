# CORE.md — Jenni Khoe MUA Project

> Baca file ini **pertama** sebelum mulai kerja.
> Semua dokumen governance ada di `docs/`.

---

## 1. Workspace

| Item | Path / Detail |
|------|---------------|
| Project root | `C:\Users\Administrator\Documents\WEB MUA` |
| Frontend | `frontend/` (Next.js 15 App Router + Tailwind CSS v4) |
| Backend & DB | **Full Serverless**: Supabase (PostgreSQL 17, Auth, Storage) |
| Vercel Deployment | Root directory: `frontend` |
| Legacy Reference | `backend/` (Laravel 11 API reference logic) |
| Docs | `docs/` |
| SQL Schema | `supabase_schema.sql` (PostgreSQL DDL with RLS) |

> **Arsitektur Aktif (Per 2026-09-11):**
> Sistem beroperasi secara **Full Serverless** di Vercel + Supabase (`ap-southeast-1`).
> Autentikasi menggunakan **Supabase Auth** (`admin@jennikhoe.com`).
> Tidak ada VPS atau server PHP backend yang perlu dijalankan.

## 2. Remote & Layanan Cloud

| Layanan | Detail / URL |
|---------|-------------|
| GitHub | `https://github.com/Albertensen/Jenni-Khoe-Web.git` (branch `main`) |
| Vercel | Project `jenni-khoe-mua` (Production: `https://jenni-khoe-mua.vercel.app`) |
| Supabase | Project `Jenni Khoe MUA` (`yegyiqyqtcbvjjqxvyto`, Region: `ap-southeast-1`) |
| Credentials | Tersimpan di `.workspace.env` (JANGAN DI-COMMIT) |

## 3. Wajib Dibaca Sebelum Kerja

| Dokumen | Isi |
|---------|-----|
| `docs/AGENTS.md` | Roles, authority, token-saving protocol, dispatch rules |
| `docs/ARCHITECTURE.md` | Supabase schema, API design, state machine, webhook |
| `docs/ROADMAP.md` | Milestones, phase order, target |
| `docs/WORKFLOW.md` | Git convention, audit gate, deploy |
| `docs/CHECKLIST.md` | Definition of Done per phase |
| `docs/DESIGN_SYSTEM.md` | Design tokens, components, layout |
| `docs/SESSION_STATUS.md` | Session handoff status (update antar sesi) |
| **`CHANGELOG.md`** | Log progress — **wajib diupdate setiap ada perubahan** |
| **`CORE.md`** (ini) | Entry point — baca pertama |

## 4. Aturan Kerja

### Priority
1. Baca CORE.md & docs/SESSION_STATUS.md
2. Baca ROADMAP.md — kerjakan sesuai urutan phase
3. Update CHANGELOG.md setiap selesai task
4. Ikuti WORKFLOW.md untuk git commit & deploy

### Git & Deploy
- Branch `main` sinkron dengan upstream
- Commit pakai conventional commits (`feat:`, `fix:`, `chore:`)
- File baru wajib di-`git add <file>` secara spesifik, jangan `git add .` atau `git add -A`
- **Tiap selesai task**: Audit -> Git commit atomik -> Push ke `origin main` -> Deploy Vercel

### Update Log
- **CHANGELOG.md** diupdate tiap ada progress (apa yang selesai, waktu, file)
- **CORE.md** diupdate jika ada perubahan arsitektur atau remote
