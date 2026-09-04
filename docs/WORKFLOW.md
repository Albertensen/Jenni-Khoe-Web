# Workflow: Git Convention, Audit Gate & Deploy Protocol

## 1. Git Convention

### Branching Policy
| Branch | Purpose | Protection |
|--------|---------|------------|
| `main` | Production | Protected — no direct push. PR only + audit pass |
| `dev` | Staging/Integration | Push allowed. CI gate required |
| `feat/*` | Feature branches | Branch from `dev`. PR → `dev` via squash |

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

### Merge Strategy
- Feature → dev: squash merge
- Dev → main: PR + audit + merge commit

## 2. Audit Gate (@Qa Testing)

### Gate Triggers
- Every push to `dev`
- Every PR targeting `main`

### Mandatory Checks
| Check | Command | Failure |
|-------|---------|---------|
| TypeScript | `tsc --noEmit` | Zero errors required |
| ESLint | `eslint . --max-warnings 0` | Zero warnings |
| Prettier | `prettier --check .` | Formatting lock |
| API Response Shape | curl test on sample endpoints | 200/403 JSON shape must match spec |

### Audit Protocol
1. Run all checks sequentially
2. **First failure stops immediately**
3. Report format:
   ```
   [AUDIT: FAILED] eslint: src/components/BeforeAfterSlider.tsx line 47
   `position` variable unused — remove or implement
   ```
4. Error forwarded to @qwen for fix
5. No re-check until @qwen reports fix committed

## 3. Deploy Protocol

### Frontend (Next.js) → Vercel
```
cd frontend
vercel --prod
```

Requirements:
- `vercel.json` at `frontend/` root
- Environment variables sourced from `.env.production` (gitignored)
- Build command: `next build`

### Backend (Laravel API)
- Server: VPS / Cloud Run (manual setup per @hermes spec)
- Deploy via git tag: `git tag prod-v1.0.0 && git push origin prod-v1.0.0`
- Post-deploy: `php artisan migrate --force && php artisan queue:restart`

### Env Setup
```
cp .env.example .env
# Fill secrets: DB, XENDIT_WEBHOOK_TOKEN, GOOGLE_OAUTH, GOOGLE_CALENDAR_ID, WA_API_KEY
```