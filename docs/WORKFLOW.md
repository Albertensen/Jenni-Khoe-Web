# Workflow: Git Convention, Audit Gate & Deploy Protocol

## 1. Git Convention

### Branching Policy
| Branch | Purpose | Protection |
|--------|---------|------------|
| `main` | Production | Aktif tersinkron dengan remote GitHub |
| `dev` | Staging/Integration | Push allowed |
| `feat/*` | Feature branches | Branch dari `dev` atau `main` |

### Commit Convention (Conventional Commits)
```
feat: add Before/After image slider component
fix: correct HMAC signature comparison offset
chore: update Tailwind config tokens
refactor: extract webhook verification to middleware
docs: add ERD schema to ARCHITECTURE.md
```

**Rules:**
- Subject ≤72 chars, lowercase, no trailing period
- Body optional — only if extra context needed
- 1 commit = 1 logical change (atomic)
- Dilarang `git add .` atau `git add -A`. Hanya stage file yang disentuh (`git add <file>`)

## 2. Audit Gate

### Mandatory Checks Sebelum Commit/Deploy
| Check | Command | Failure |
|-------|---------|---------|
| TypeScript & Build | `cd frontend && npm run build` | Zero errors required |
| ESLint | `cd frontend && npm run lint` | Zero warnings |
| Auth Check | Test login endpoint `/api/login` | HTTP 200 required |

## 3. Deploy Protocol

### Architecture: Full Serverless
- Frontend & Route Handlers: **Vercel** (`jenni-khoe-mua`)
- Database & Auth: **Supabase** (`ap-southeast-1`)
- Tidak memerlukan deploy manual ke VPS. Setiap `git push origin main` memicu auto-build dan auto-deploy Vercel.

### Vercel Deployment Settings
- **Root Directory**: `frontend`
- **Framework**: Next.js (App Router)
- **Environment Variables**: Disinkronkan via Vercel Project Settings / API (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GROQ_API_KEY`)

### Database Migrations (Supabase)
- Skema disimpan di `supabase_schema.sql`
- Dijalankan via Supabase SQL Editor di dashboard atau Supabase Management API
