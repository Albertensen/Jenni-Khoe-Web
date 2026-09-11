# Changelog — Jenni Khoe MUA

Semua perubahan signifikan dicatat di file ini.
Format: [YYYY-MM-DD HH:mm] — deskripsi perubahan.

---

## 2026-09-12 00:10 — Fix Ultra-HD Texture Loupe optical coordinate calculation

### Fixed
- `frontend/src/components/portfolio/TextureLoupe.tsx` — eliminated coordinate offset where zoomed area did not match the lens circle. Replaced hardcoded dimensions with dynamic container measurement (`ResizeObserver` + `getBoundingClientRect`), auto-detected natural aspect ratio of the image to remove letterbox drift, and scaled `backgroundSize` to `containerDimensions * zoom`. Center of the loupe ring now projects with 1:1 optical accuracy to the exact cursor coordinate.

---

## 2026-09-11 23:45 — Fix remote image delivery with direct CDN rendering & seed live showcase portfolio

### Fixed
- `frontend/next.config.ts` — configured `images.unoptimized: true` and wildcard remotePatterns to eliminate Next.js Vercel 400 Bad Request (`INVALID_IMAGE_OPTIMIZE_REQUEST`) on external Unsplash / Supabase image URLs.
- `frontend/src/components/portfolio/BeforeAfterSlider2.tsx` — added `unoptimized` flag to before and dual-lighting after `<Image>` tags.
- `frontend/src/components/portfolio/LookbookMatrix.tsx` — added `unoptimized` flag to grid and modal preview `<Image>` tags.
- `frontend/src/components/portfolio/TextureLoupe.tsx` — added `unoptimized` flag to base texture inspection `<Image>` tag.

### Added
- Seeded prime showcase portfolio record `#1`: **"Royal Sundanese Siger Glam"** (Bride: Aurelia & Jonathan) with verified high-res Before, After Studio, After Natural Light, and Ultra-HD Texture loupe images, synchronized live with landing page `/` and `/admin/portfolio`.

---

## 2026-09-11 23:15 — Dynamic CMS Portfolio & Main Page Visual Proof Synchronization

### Added
- Database migration on Supabase `portfolio_items` adding columns: `category`, `bride_name`, `description`, `venue_lighting`, `before_image_path`, `after_natural_image_path`, `texture_image_path`, `is_featured_before_after`, and `is_featured_texture`.
- `frontend/src/app/api/portfolio/route.ts` — extended GET, POST, and PATCH to support full portfolio attributes, multi-image upload / URL handling, and quick featured toggling.
- `frontend/src/app/admin/portfolio/page.tsx` — upgraded CMS interface with multi-image inputs (Main After Studio, Before, After Natural Light, Ultra-HD Texture), category & lighting select, and 1-click toggles for "Main B/A Slider" and "Main Texture".
- `frontend/src/components/portfolio/LookbookMatrix.tsx` — added `initialItems` prop to render dynamic Supabase portfolio records with graceful static fallback.
- `frontend/src/app/page.tsx` — integrated live Supabase fetching with ISR (`revalidate = 60`), binding the featured Before/After transformation slider and Ultra-HD texture inspection loupe dynamically to active database records.
- `docs/ROADMAP.md` — added and marked dynamic portfolio CMS synchronization task as completed in Phase 7.

---

## 2026-09-11 22:30 — Fix admin redirect bug caused by viewport prefetching of logout link

### Fixed
- `frontend/src/app/admin/layout.tsx` — replaced `<Link href="/api/logout">` with explicit interactive `<button onClick={handleLogout}>` using POST, disabled aggressive prefetch (`prefetch={false}`) on navigation links. Next.js automatic viewport prefetch on the logout `<Link>` had been wiping the `admin_token` cookie silently in background.
- `frontend/src/app/api/logout/route.ts` — guarded GET against prefetch headers (`purpose: prefetch`, `x-purpose: prefetch`, `next-router-prefetch: 1`) so cookie is only removed upon explicit POST or intentional user logout.
- `frontend/src/middleware.ts` — decoded JWT base64url with fallback and 30s clock skew tolerance to prevent edge decode failure.
- `frontend/src/app/login/page.tsx` — enforced hard page redirect `window.location.href = "/admin"` to bust client router prefetch cache.

---

## 2026-09-11 22:00 — Complete Supabase serverless integration for admin panel & API routes

### Added
- `frontend/src/app/api/admin/stats/route.ts` — live aggregation stats from Supabase
- `frontend/src/app/api/bookings/route.ts` — bookings query joined with client details
- `frontend/src/app/api/inquiries/route.ts` — inquiries CRUD via Supabase
- `frontend/src/app/api/contracts/route.ts` — digital SPK contract archive queries
- `frontend/src/app/api/payments/route.ts` — payment reconciliation queries
- `frontend/src/app/api/schedules/route.ts` — schedule calendar slot queries
- `frontend/src/app/api/portfolio/route.ts` & `[id]/route.ts` — portfolio CMS management and deletion
- `frontend/src/app/api/ai-leads/route.ts` — AI chatbot leads archive queries

### Changed
- `frontend/src/middleware.ts` — local Supabase JWT verification eliminates prefetch rate limits and unexpected redirect to /login
- `frontend/src/app/admin/*` — removed all references to `BACKEND_URL` / `localhost:8000` across all 8 admin pages
- `frontend/src/app/api/generate-token/route.ts` — migrated from Laravel to Supabase `gated_tokens`
- `frontend/src/app/api/leads/route.ts` — directly persists inquiries and AI leads to Supabase

---

## 2026-09-11 21:30 — Update architecture & governance documentation for serverless stack

### Changed
- `README.md` — updated architecture diagram, tech stack, and setup guides to Next.js + Supabase
- `CORE.md` — updated workspace, remote, and runtime specs to reflect Supabase serverless
- `docs/ARCHITECTURE.md` — full rewrite of database DDL tables, Supabase Auth flow, and Next.js route handlers
- `docs/ROADMAP.md` — updated tech stack specs and milestone items for Supabase PostgreSQL
- `docs/WORKFLOW.md` — updated audit gate, Vercel rootDirectory, and deploy protocol
- `docs/SESSION_STATUS.md` — added complete handoff notes, active credentials, and next-agent guidelines

---

## 2026-09-11 21:00 — Migrate auth & database architecture to Supabase serverless

### Added
- `supabase_schema.sql` — PostgreSQL DDL schema with RLS for Supabase project
- `frontend/src/lib/supabase.ts` — lightweight Supabase client initialization helper

### Changed
- `frontend/src/app/api/login/route.ts` — switched from local Laravel proxy to direct Supabase Auth
- `frontend/src/middleware.ts` — verified session token via Supabase Auth API
- `frontend/package.json` — installed `@supabase/supabase-js` and `@supabase/ssr`

---

## 2026-09-11 20:30 — Fix bootstrap providers and configure Sanctum API guard

### Fixed
- `backend/bootstrap/providers.php` — restored `AppServiceProvider::class` registration
- `backend/config/auth.php` — configured default API guard with `sanctum` driver

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
