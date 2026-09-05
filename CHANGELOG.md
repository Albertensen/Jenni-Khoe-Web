# Changelog — Jenni Khoe MUA

Semua perubahan signifikan dicatat di file ini.
Format: [YYYY-MM-DD HH:mm] — deskripsi perubahan.

---

## 2026-09-05

### 09:00 — Setup workspace & toolchain
- Patched `_winjob.py` + `bash.py` — CREATE_NO_WINDOW flag (0x08000000) untuk suppress console flash
- Installed PHP 8.3.33 di `C:\tools\php83`, Composer 2.10.3
- PATH updated via HKCU\Environment
- Installed `openai` Python package

### 09:15 — Sub-agent setup
- LM Studio endpoint verified: `http://localhost:1234/v1`
- Dispatch function created: `dispatch()` — tulis task spec ke `.subagent/tasks/`, POST ke LM Studio, simpan output ke `.subagent/outputs/`
- Continual harness memori: dispatch pattern + config saved

### 10:30 — Model switch & optimasi
- Switch `huihui-qwen3.8-27b-abliterated` -> `qwen2.5-coder-14b-instruct` (14B Q5_K_M)
- Reasoning OFF, ctx 16384, evalBatchSize 1024, temperature 0.1
- Performance: ~7 tok/s, cukup untuk 1 file per task
- GPU: RTX 3060 Ti 8GB, offload 31/48 layers, VRAM ~85% used

### 11:00 — GitHub & Vercel integration
- GitHub remote updated with full-access PAT
- Remote: `https://github.com/Albertensen/Jenni-Khoe-Web.git`
- Vercel project `jenni-khoe-mua` created under team REBAHAN
- Frontend deployed (production): `https://jenni-khoe-ggkh66nc8-rebahan.vercel.app`
- Vercel token configured

### 11:15 — Backend scaffold (via sub-agent qwen2.5-coder-14b)
- `backend/composer.json` — Laravel 11 + Socialite + Dompdf
- `backend/.env.example` — DB, Google OAuth, Xendit, WhatsApp config

### 11:30 — Governance docs updated
- Created `CORE.md` — master entry point (workspace, remote, rules)
- Created `CHANGELOG.md` — progress log (wajib update setiap perubahan)
- Removed `PROJECT_STATE.md` dan `TASK_LOG.md` (digantikan CORE.md + CHANGELOG.md)

---

## Format
**Task:** [nama task]
**Sub-agent:** [sub-agent yang dipakai]
**Files:** [file yang dihasilkan]
**Status:** Done / WIP / Failed
**Notes:** [catatan penting]

### 2026-09-05 10:40 — Git sync GitHub
- README.md: updated with WAJIB BACA redirect to CORE.md
- CORE.md: created (master entry point)
- CHANGELOG.md: created (progress log)
- frontend/.gitignore: added .vercel
- frontend/vercel.json: created
- backend/composer.json: Laravel 11 scaffold
- backend/.env.example: env config
- Commit 17f50ad pushed to origin/main
- Status: ✅ local = remote (clean)
### 2026-09-05 10:55 — Master roadmap replacement from Gemini spec
- docs/ROADMAP.md: replaced with 8-phase master roadmap (luxury portfolio + autonomous booking engine)
- Tech stack: Next.js 15, React 19, Tailwind v4, Laravel 11, MySQL 8, Xendit, Google Calendar, WhatsApp
- 35 items, 5 done, 30 pending
- Source: gemini-code-1788580456790.md
- Commit pushed to origin/main