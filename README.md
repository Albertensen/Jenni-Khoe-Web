# Jenni Khoe MUA — Web Profile & Gated Booking System

> **⚠️ WAJIB BACA SEBELUM KERJA:**
> Buka [`CORE.md`](./CORE.md) untuk workspace info, remote, aturan, dan daftar dokumen governance.
> Semua progress dicatat di [`CHANGELOG.md`](./CHANGELOG.md).

---

Official website and booking system for Jenni Khoe Makeup Artist (MUA).

## Architecture (Full Serverless)

> **Catatan Transisi Arsitektur (2026-09-11):**
> Arsitektur telah dimigrasikan dari standalone Laravel 11/MySQL VPS menjadi **Full Serverless** (Next.js App Router di Vercel + Supabase PostgreSQL & Auth). Tidak memerlukan VPS atau server backend terpisah.

```
┌────────────────────────────────────────────────────────────────────────┐
│  Next.js 15 (App Router on Vercel)                                     │
│  ├── Public pages (Hero, Before/After slider, Galeri, Contact)        │
│  ├── Booking flow (Cek Tanggal → Inquiry Form → Gated Token)           │
│  ├── Serverless API Routes (`src/app/api/*`: login, chat, leads, dll)  │
│  └── Admin Dashboard (`src/app/admin/*`: bookings, schedules, clients) │
├────────────────────────────────────────────────────────────────────────┤
│  Supabase (Cloud PostgreSQL 17 + Auth + Storage)                       │
│  ├── Database: PostgreSQL 17 with Row Level Security (RLS)             │
│  │   (clients, bookings, quotations, contracts, payments, schedules)   │
│  ├── Authentication: Supabase Auth (admin role, session JWT)           │
│  └── Storage: Supabase Storage Buckets (portfolio, contract signatures)│
└────────────────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Tech | Deploy |
|-------|------|--------|
| Frontend & API Routes | Next.js 15 (App Router) + Tailwind CSS v4 | Vercel (`jenni-khoe-mua`) |
| Database & Auth | Supabase PostgreSQL 17 + Supabase Auth | Supabase Cloud (`ap-southeast-1`) |
| Storage & Media | Supabase Storage (WebP/AVIF) | Supabase Cloud |
| Payment Gateway | Midtrans / Xendit (QRIS, VA) | Webhook verified |
| Calendar | Google Calendar API (OAuth2 + FreeBusy) | Next.js API Route |
| Notification | WhatsApp Cloud API / WA Gateway | Webhook / API Dispatcher |
| AI Chat | Groq Cloud SDK (`llama-3.3-70b-versatile`) | Serverless API Route |

## Repo Structure

```
/
├── frontend/             # Next.js 15 App Router (Root Vercel Deployment)
│   ├── public/           # WebP assets, fonts
│   └── src/
│       ├── app/          # App Router (pages & serverless api routes)
│       │   ├── admin/    # Protected Admin Dashboard
│       │   ├── api/      # Next.js Route Handlers (auth, chat, leads, etc.)
│       │   ├── g/        # Gated routes
│       │   └── login/    # Admin Login page
│       ├── components/   # Reusable UI components & luxury design system
│       ├── lib/          # Utilities, Supabase client (`src/lib/supabase.ts`)
│       └── middleware.ts # Supabase token session verification & route protection
├── backend/              # Legacy Laravel 11 API reference & business logic
├── docs/                 # Project documentation & governance
│   ├── ROADMAP.md
│   ├── ARCHITECTURE.md
│   ├── DESIGN_SYSTEM.md
│   ├── WORKFLOW.md
│   ├── AGENTS.md
│   └── CHECKLIST.md
├── supabase_schema.sql   # PostgreSQL DDL with RLS for Supabase
├── README.md
└── CHANGELOG.md
```

## Local Setup

### Prerequisites
- Node 22 + npm
- Akun Supabase (project URL & anon key)

### Setup Frontend
```bash
cd frontend
npm install
cp .env.example .env.local
# Isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev
```

Buka `http://localhost:3000`.

## Environment Variables (Required)

| Key | Source | Used By |
|-----|--------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project Settings -> API | Frontend & API Routes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Project Settings -> API | Frontend & API Routes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Project Settings -> API | Next.js Server API Routes |
| `GROQ_API_KEY` | Groq Cloud Console | AI Assistant Chat API |
| `NEXT_PUBLIC_APP_URL` | Domain production/local | Absolute URLs & callbacks |

Kredensial aktif workspace disimpan di `.workspace.env` (dijaga oleh `.gitignore`).

## Documentation

- **[ROADMAP.md](docs/ROADMAP.md)** — Master roadmap & milestone plan
- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** — Database schema, Supabase auth, state machine, webhook
- **[DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md)** — Design tokens, components, luxury aesthetic
- **[WORKFLOW.md](docs/WORKFLOW.md)** — Git convention, audit gate, deploy protocol
- **[AGENTS.md](docs/AGENTS.md)** — Governance & multi-agent rules
- **[CHECKLIST.md](docs/CHECKLIST.md)** — Definition of Done checklist
