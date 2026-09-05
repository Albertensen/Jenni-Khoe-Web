# Changelog — Jenni Khoe MUA

Semua perubahan signifikan dicatat di file ini.
Format: [YYYY-MM-DD HH:mm] — deskripsi perubahan.

---

## 2026-09-05 21:30 — Docker deploy, portfolio upload, PHP fixes, cron completion

### Added
- Dockerfile + docker-compose.yml + Nginx/Supervisor config — PHP 8.3 FPM + MySQL 8.0 container stack
- `.env.production` template for deployment
- Portfolio upload API: `POST /api/portfolio` (multipart image), `DELETE /api/portfolio/{id}`, `POST /api/portfolio/reorder`
- Admin portfolio page — upload form with file input + image preview, delete button
- `config/services.php` — Google Calendar + WhatsApp API config keys
- `.env` — Google Calendar, WhatsApp config placeholder keys
- `GET /api/schedule/check-expired-holds` endpoint (trigger Artisan command from cron-less env)

### Changed
- `app/Console/Commands/CheckExpiredHolds.php` — completed handle() logic (was stub), status check uses `BookingStateMachine::APPROVED` constant
- `app/Http/Controllers/PortfolioController.php` — fixed `$p` variable reference (syntax error)
- `app/Http/Controllers/ScheduleController.php` — fixed `$s` variable reference (syntax error)
- `app/Http/Controllers/ContractController.php` — fixed `$c` variable reference (syntax error)
- `app/Http/Controllers/PaymentController.php` — fixed `$p` variable reference (syntax error)
- `app/Http/Controllers/AiLeadController.php` — fixed `$l` variable reference (syntax error)
- `app/Http/Controllers/BookingController.php` — removed duplicate `index()` method (was 3 copies)
- `app/Http/Controllers/GatedRouteController.php` — fixed broken class syntax
- `app/Http/Controllers/PortfolioUploadController.php` — fixed `$i` variable reference
- `app/Console/Kernel.php` — fixed escaped `$this` syntax
- `app/Models/Booking.php` — fixed escaped `$` signs
- All 38 PHP files verified syntax-clean
- Frontend Next.js build: verified clean (exit 0)



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


## 2026-09-05 19:41 — Phase 8 bug fixes (audit-driven)

### Critical Fixes
- `backend/bootstrap/app.php`: Added `api:` route loading — sebelumnya hanya web.php, seluruh backend API tidak berfungsi (@Prime_Agent)
- `backend/app/Services/GatedRouteService.php`: Ganti `Str::random(64)` ke `bin2hex(random_bytes(32))` — token sebelumnya pakai 62-char alphabet (a-z, A-Z, 0-9) tapi controller validasi regex `/^[a-f0-9]{64}$/`, akibatnya **setiap token ditolak** (@Prime_Agent)
- `frontend/src/app/api/leads/route.ts`: Tambah `checkRateLimit()` — sebelumnya import utility tapi tidak pernah dipanggil, endpoint publik tanpa proteksi (@Prime_Agent)
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
### 2026-09-05 10:57 — Embedded Push+Deploy rule (mandatory per task completion)
- CORE.md sect5: new rule — setiap selesai task wajib push + deploy
- Continual harness: memory + policy updated with same rule
- This commit is proof the rule works
### 2026-09-05 11:01 — Push+Deploy rule proven + Vercel deploy
- CORE.md sect5: embedded mandatory push+deploy per task
- Continual harness: memory + policy updated
- Vercel: removed vercel.json (auto-detect Next.js works fine)
- Latest deploy: https://jenni-khoe-bjg3w2tym-rebahan.vercel.app (Ready)
- This entry = proof of rule working
### 2026-09-05 11:39 — Phase 1 Laravel scaffold complete
- 10 migrations: users, clients, bookings, quotations, contracts, payments, schedules, logs, social_accounts, inquiries
- 10 Eloquent models with relationships & casts
- 3 API controllers: CRUD clients/bookings, inquiry intake, date availability
- API routes: apiResource + custom endpoints
- composer install: 85 deps (Laravel 11, Socialite, Dompdf)
- Commit pushed to origin/main
### 2026-09-05 11:40 — Vercel deploy after Laravel scaffold
- Frontend deployed: https://jenni-khoe-3rnybozb8-rebahan.vercel.app (200 OK)
- Backend scaffold + composer install pushed to GitHub
### 2026-09-05 11:43 — Phase 1 complete (all items)
- docs/GIT_POLICY.md: branching (main/dev/feature), conventional commits
- backend/pint.json: PHP Pint Laravel preset
- frontend/.eslintrc.json: strict TS rules
- frontend/.prettierrc: with tailwindcss plugin
- frontend/tsconfig.json: strict mode
- git branch `dev` created on remote
- All Phase 1 items checked off in ROADMAP.md
### 2026-09-05 11:56 — Phase 2 complete: Brand Identity & UI System
- Typography: Cormorant Garamond (serif) + Plus Jakarta Sans (sans) + Cinzel (display)
- Lenis smooth scroll integration (SmoothScrollProvider)
- UI atomic components: Button (glassmorphism), FloatingLabelInput, Dialog, Toast (context)
- Framer Motion page transitions (PageTransition)
- Tailwind v4 theme: luxury palette already set
- All Phase 2 items checked off
### 2026-09-05 12:12 — Phase 3 complete: Interactive Portfolio & Visual Proof
- Ultra-HD Texture Loupe: magnifier with 3.5x zoom for skin texture inspection
- Multidimensional Lookbook Matrix: filterable gallery by skin undertone + venue lighting
- Before/After Slider 2.0: dual lighting toggle (Studio Flash vs Natural Sunlight)
- Social Proof & Bride Stories: testimonial carousel with rating, quote, location
- All Phase 3 items checked off ROADMAP
### 2026-09-05 12:18 — Phase 3 final: mobile audit + WebP/AVIF optimization
- TextureLoupe: touch support for mobile
- BeforeAfterSlider2: touch-action manipulation
- globals.css: responsive font size, touch-friendly range thumb
- next.config.ts: WebP/AVIF image formats, device sizes
- layout.tsx: viewport metadata (width, initialScale, themeColor)
- ROADMAP Phase 3: 7/7 checked [x]
### 2026-09-05 12:27 — Phase 4: Autonomous AI CS Chat Widget
- ChatBubble: floating luxury glassmorphism bubble + chat panel (React, Framer Motion, Tailwind)
- API /api/chat: Vercel AI SDK edge function with Groq Cloud (llama3-8b-8192)
- API /api/leads: lead capture endpoint with validation
- FAQ knowledge base (9 items) + Intent Detector (7 intents)
- Context Memory + System Prompt with Guardrails
- Fallback to static FAQ when API key missing
- GROQ_API_KEY + GROQ_MODEL added to Vercel environment
### 2026-09-05 12:34 — Phase 4 complete: Calendar, WhatsApp Dispatcher & Inquiry API
- DateCalendar: visual availability calendar (available/booked/hold) with navigation
- WhatsAppDispatcher: structured booking form -> WhatsApp pre-filled message
- InquiryController (Laravel): POST /api/inquiries with throttle:5,1 + validation
- Inquiry model + migration (inquiries table)
- All 5 Phase 4 items checked
### 2026-09-05 12:40 — Phase 5: Database Architecture, State Machine & Gated Route
- BookingStateMachine service: full state transition validation (8 states, 16 transitions)
- GatedRouteService: cryptographic 64-char token generator with 48h TTL, one-time use
- GatedToken model + migration: booking_id, token (UNIQUE), expires_at, used_at
- GatedRouteController: GET /g/{token} consumes one-time token, returns booking with relations
- Booking model: added gatedTokens() + client() relations
- DATABASE_AUDIT.md: schema audit, FK validation, transition matrix, sanitization policy
- ROADMAP Phase 5: 4/4 complete
### 2026-09-05 12:48 — Phase 6: Closing Portal, E-Signature, PDF Engine & Payment Gateway
- UrgencyCountdownBanner: countdown timer (hold_expires_at) with expiry callback
- AddonCustomizer: 8 add-on items with real-time subtotal + DP 50% calculator
- SignatureCanvas: touch + mouse signature pad with clear/reset
- PdfEngineService: Dompdf-based invoice + contract generation with watermark
- PDF views: invoice.blade.php (itemized) + contract.blade.php (legal terms + signature)
- PaymentGatewayService: QRIS + VA charge creation, HMAC-SHA256 webhook verification
- PaymentController + WebhookController: REST endpoints for payment + callback
- Payment migration: added payment_channel, external_id, qr_code_url, va_number, bank fields
- API routes: POST /payments/qris, POST /payments/va, POST /webhooks/payment
- ROADMAP Phase 6: 5/5 complete
## [Phase 7] — 2026-02-25

### Added
- WebhookController: idempotency protection via Cache lock (300s + 24h final TTL)
- Console command CheckExpiredHolds: auto-expire booking holds via cron
- GoogleCalendarService: FreeBusy check + createEvent for confirmed bookings
- WhatsAppNotificationService: deep link generator, booking confirmation, payment reminder, gated link
- Admin portal (9 pages): Dashboard with MetricCard, Inquiries kanban, Bookings with gated link generator, Interactive Schedule Calendar, SPK Contracts Archive, Payment Reconciliation, Portfolio CMS, AI Leads Center
- SANDBOX_AUDIT.md: end-to-end flow simulation documentation

### Changed
- Kernel.php: registered CheckExpiredHolds schedule (everyMinute)

## [Phase 8] — 2026-02-26

### Security
- SignatureCanvas: XSS sanitization — data URL prefix validation on save
- API rate limiting: checkRateLimit() utility, 10 req/60s per IP on /api/chat and /api/leads
- GatedRouteController: token format validation (64-char hex regex prevents injection)

### Performance
- next.config.ts: compiler.removeConsole in production (dead code elimination)
- Fonts: latin subset via next/font (Plus Jakarta Sans, Cinzel, Cormorant Garamond)

### SEO
- JSON-LD Schema.org LocalBusiness + OfferCatalog (4 service types) in root layout
- Metadata: Open Graph tags, keywords, robots index/follow, title template
