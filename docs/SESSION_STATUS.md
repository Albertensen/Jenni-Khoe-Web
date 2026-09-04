# Session 1 Handoff — Jenni Khoe MUA Project Status

> Baca file ini **sebelum memulai sesi baru**.
> Update & commit sesi baru = `docs/AGENTS.md` §4 protocol diikuti.

---

## 1. Tim & Stack

| Agent | Role | Model | Constraint |
|-------|------|-------|------------|
| @hermes | System Architect | COMBO-UTAMA | - |
| @gemini | UI/UX Engineer | Gemini Flash | 429 rate limit, max 1 spec per turn |
| @qwen | Fullstack Worker | Qwen 2.5 Coder 14B (local) | ~32K context, stuck on multi-file tasks |
| @qa_testing | DevOps & QA | (varies) | - |

**Tech stack**: Next.js App Router (frontend) + Laravel 11 API (backend) + MySQL + Midtrans/Xendit + Google Calendar + WhatsApp Notification

**Repo**: `https://github.com/Albertensen/Jenni-Khoe-Web.git` — branch `main` (protected), `dev` (integration), remote hijau.

---

## 2. Completed (End of Session 1)

| Item | Detail | By |
|------|--------|----|
| `docs/ROADMAP.md` | 6-phase milestone plan, atomic checklist | @user spec |
| `docs/ARCHITECTURE.md` | DB schema (5 tables), state machine, webhook HMAC, Google Calendar OAuth, gated logic | @hermes |
| `docs/DESIGN_SYSTEM.md` | Tailwind tokens (champagne/rose gold), typography, Before/After slider spec, booking form UX | @gemini |
| `docs/WORKFLOW.md` | Git convention, audit gate (tsc/eslint/prettier), deploy protocol | @qa_testing |
| `docs/AGENTS.md` | Role boundaries, token-saving protocol, **Task Sizing & Dispatch Protocol** (baru) | @hermes update |
| `docs/CHECKLIST.md` | DoD per milestone phase | @qa_testing |
| `README.md` | Project overview, setup instructions, env vars | @hermes |
| Scaffold Next.js | `frontend/` scaffold with luxury design system | committed (7662556) |

**Git commits:**
```
7662556 feat: scaffold Next.js frontend with luxury design system
26dcc63 docs: establish project governance, architecture, and design specs
a8f1a98 chore: update ROADMAP.md with full spec from hermes and gemini
15c88e8 chore: initialize project roadmap and milestone specs
```

2 file modified uncommitted: `docs/AGENTS.md` §4 baru, `docs/ROADMAP.md`.

---

## 3. Pending / Next Steps

### Phase 1 — Environment & Scaffolding (50% done)
- [x] Scaffold Next.js di `frontend/`
- [ ] **Install PHP 8.3 + Composer** (@qwen — not done, toolchain belum ada)
- [ ] **Scaffold Laravel API** di `backend/` (after PHP/Composer)
- [ ] Setup ESLint, branch protection, Vercel hook (@qa_testing)

### Phase 2 — Design System & Company Profile (spec ready, code 0%)
- Spec tokens & komponen di `docs/DESIGN_SYSTEM.md` — tinggal implement
- Queue: @gemini → @qwen one component at a time

### Phase 3 — DB, API, Gated Logic (spec ready, code 0%)
- Full spec di `docs/ARCHITECTURE.md`
- Queue: @hermes → @qwen one endpoint/migration at a time

### Phase 4 — Payment & Calendar (spec ready, code 0%)
- Webhook HMAC + Google OAuth spec ready

---

## 4. Dispatch Protocol (Harus Diikuti Sesi Baru)

**One turn = one unit:** 1 file, 1 migration, 1 component, 1 bug fix. Never ≥2.

```
Payload ≤1 unit       → @qwen
Payload 2-5           → split: @qwen half, @gemini half
Payload ≥5 / synthesis → @hermes or @gemini leads
@qwen silent 1 turn   → re-dispatch smaller
@qwen silent 2 turns  → @hermes/@gemini takeover
@gemini input          → max 1 spec per turn, large content via file path ref
```

Spec final sebelum dispatch — no iterative refinement mid-task.

---

## 5. Files Reference (Sesi Baru)

| File | Isi |
|------|-----|
| `docs/ARCHITECTURE.md` | DB skema, state machine, webhook, calendar, gated logic |
| `docs/DESIGN_SYSTEM.md` | Tailwind token, komponen slider, form UX, layout |
| `docs/WORKFLOW.md` | Git rule, audit gate, deploy |
| `docs/AGENTS.md` | **§4 Dispatch Protocol** — priority read |
| `docs/ROADMAP.md` | Task checklist 6 phase |
| `docs/CHECKLIST.md` | DoD per phase |

---

## 6. Action Sesi Baru

1. Read this file first → semua agent tau status
2. @qa_testing commit `docs/AGENTS.md` + `docs/ROADMAP.md` modified (yang belum)
3. @qwen install PHP 8.3 + Composer (Phase 1)
4. Mulai scaffold Laravel backend
5. Lanjut komponen Phase 2 one-at-a-time