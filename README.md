# Jenni Khoe MUA — Web Profile & Gated Booking System

> **⚠️ WAJIB BACA SEBELUM KERJA:**
> Buka [`CORE.md`](./CORE.md) untuk workspace info, remote, aturan, dan daftar dokumen governance.
> Semua progress dicatat di [`CHANGELOG.md`](./CHANGELOG.md).

---

# Jenni Khoe MUA — Web Profile & Gated Booking System

Official website and booking system for Jenni Khoe Makeup Artist (MUA).

## Architecture (Hybrid)

```
┌──────────────────────────────────────────────────────┐
│  Frontend (Next.js App Router) → Vercel               │
│  ├── Public pages (hero, gallery, about, contact)     │
│  ├── Booking flow (check date → inquiry → pay)        │
│  └── Admin dashboard (manage bookings, calendar)       │
├──────────────────────────────────────────────────────┤
│  Backend (Laravel API) → VPS / Cloud Run              │
│  ├── MySQL database (clients, bookings, payments, ...)│
│  ├── Xendit/Midtrans payment webhook (HMAC verified)  │
│  ├── Google Calendar sync (OAuth2 + FreeBusy API)     │
│  └── WhatsApp notification gateway                    │
└──────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Tech | Deploy |
|-------|------|--------|
| Frontend | Next.js (App Router) + Tailwind CSS | Vercel |
| Backend | Laravel 11 + PHP 8.3 | VPS / Cloud Run |
| Database | MySQL 8.0 | Cloud SQL / RDS |
| Payment | Midtrans / Xendit (QRIS, VA) | Webhook verified |
| Calendar | Google Calendar API (OAuth2 + FreeBusy) | Socialite |
| Notification | WhatsApp Cloud API / WA Gateway | |

## Repo Structure

```
/
├── frontend/          # Next.js App Router
│   ├── public/        # WebP assets, fonts
│   └── src/
│       ├── app/       # Pages & routes
│       ├── components/  # Reusable components
│       └── lib/       # Utilities, API client
├── backend/           # Laravel API
│   ├── app/
│   │   ├── Http/Controllers/
│   │   ├── Models/
│   │   └── Jobs/      # SyncCalendarBooking, WhatsAppNotif
│   ├── database/migrations/
│   └── routes/api.php
├── docs/              # Project documentation
│   ├── ROADMAP.md
│   ├── ARCHITECTURE.md
│   ├── DESIGN_SYSTEM.md
│   ├── WORKFLOW.md
│   ├── AGENTS.md
│   └── CHECKLIST.md
├── README.md
└── .env.example
```

## Local Setup

### Prerequisites
- PHP 8.3 + Composer
- Node 22 + npm
- MySQL 8.0

### Backend
```bash
cd backend
cp .env.example .env
# Fill DB credentials, API keys, webhook tokens
composer install
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env.local
# Fill NEXT_PUBLIC_API_URL=http://localhost:8000/api
npm run dev
```

## Environment Variables (Required)

| Key | Source | Used By |
|-----|--------|---------|
| `DB_*` | MySQL | Backend |
| `XENDIT_SECRET_KEY` | Xendit Dashboard | Backend |
| `XENDIT_WEBHOOK_TOKEN` | Xendit Callback Settings | Backend |
| `GOOGLE_OAUTH_CLIENT_ID` | Google Cloud Console | Backend |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Google Cloud Console | Backend |
| `GOOGLE_CALENDAR_ID` | Google Calendar Settings | Backend |
| `WA_API_KEY` | WhatsApp Gateway Provider | Backend |
| `NEXT_PUBLIC_API_URL` | - | Frontend |

## Documentation

All project specs in `docs/`:
- **[ROADMAP.md](docs/ROADMAP.md)** — 6-phase milestone plan
- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** — DB schema, state machine, webhook, calendar sync
- **[DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md)** — Tailwind tokens, components, layout
- **[WORKFLOW.md](docs/WORKFLOW.md)** — Git conventions, audit gate, deploy
- **[AGENTS.md](docs/AGENTS.md)** — Team roles & token-saving protocol
- **[CHECKLIST.md](docs/CHECKLIST.md)** — DoD checklist per phase

## Multi-Agent Team

| Agent | Role |
|-------|------|
| @hermes | System Architect |
| @gemini | UI/UX Engineer |
| @qwen | Fullstack Worker |
| @qa_testing | DevOps & QA |