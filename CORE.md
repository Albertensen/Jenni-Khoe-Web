# CORE.md — Jenni Khoe MUA Project

> Baca file ini **pertama** sebelum mulai kerja.
> Semua dokumen governance ada di `docs/`.

---

## 1. Workspace

| Item | Path |
|------|------|
| Project root | `C:\Users\Administrator\Documents\WEB MUA` |
| Frontend | `frontend/` (Next.js App Router + Tailwind) |
| Backend | `backend/` (Laravel 11 API) |
| Docs | `docs/` |
| Sub-agent tasks | `.subagent/tasks/` |
| Sub-agent outputs | `.subagent/outputs/` |

## 2. Remote

| Layanan | URL / Detail |
|---------|-------------|
| GitHub | `https://github.com/Albertensen/Jenni-Khoe-Web.git` |
| Vercel | Team REBAHAN, project `jenni-khoe-mua` |
| Vercel Production | `https://jenni-khoe-ggkh66nc8-rebahan.vercel.app` |

## 3. Wajib Dibaca Sebelum Kerja

| Dokumen | Isi |
|---------|-----|
| `docs/AGENTS.md` | Roles, authority, token-saving protocol, dispatch rules |
| `docs/ARCHITECTURE.md` | DB schema, API design, state machine |
| `docs/ROADMAP.md` | Milestones, phase order, target |
| `docs/WORKFLOW.md` | Git convention, audit gate, deploy |
| `docs/CHECKLIST.md` | Definition of Done per phase |
| `docs/DESIGN_SYSTEM.md` | Design tokens, components, layout |
| `docs/SESSION_STATUS.md` | Session handoff status (buat dibaca antar sesi) |
| **`CHANGELOG.md`** | Log progress — **wajib diupdate setiap ada perubahan** |
| **`CORE.md`** (ini) | Entry point — baca pertama |

## 4. Aturan Kerja

### Priority
1. Baca CORE.md
2. Baca ROADMAP.md — kerjakan sesuai urutan phase
3. Update CHANGELOG.md setiap selesai task
4. Ikuti WORKFLOW.md untuk git commit

### Code Generation
- Semua kode dikerjakan sub-agent (`qwen2.5-coder-14b-instruct` via LM Studio localhost:1234/v1)
- 1 file = 1 dispatch (AGENTS.md sect4)
- Audit tiap output sebelum commit

### Git
- Branch `main` dilindungi
- Kerja di branch `dev` atau `feat/*`
- Commit pakai conventional commits (WORKFLOW.md sect1)
- File baru wajib di-`git add` spesifik, jangan `git add -A`

### Update Log
- **CHANGELOG.md** diupdate tiap ada progress (apa yang selesai, waktu, file)
- **CORE.md** diupdate hanya jika ada perubahan struktural (path baru, remote baru)

---

*Terakhir update: 2026-09-05*


## 5. Wajib: Push + Deploy Setiap Task Selesai

Setiap kali selesai task (file baru / perubahan / fix), **wajib**:
1. **Audit** — pastikan tidak error, tidak placeholder, hasil sesuai spec
2. **Git add + commit** — hanya file yang kamu ubah (`git add <file>`), pakai conventional commit
3. **Git push** ke `origin main` — agar saya bisa cek perubahan di GitHub
4. **Vercel deploy** — jalankan `vercel --prod --token ...` untuk frontend
5. **Update CHANGELOG.md** — catat apa yang selesai, jam, file yang diubah

> Aturan ini tidak bisa ditawar. Tidak ada "nanti aja" atau "besok push".
> Selesai task = push & deploy dalam sesi yang sama.