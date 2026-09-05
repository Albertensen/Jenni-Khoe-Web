# Git Branching Policy

## Branches
- `main` — production. Hanya merge dari `dev` via PR. Wajib push + deploy Vercel.
- `dev` — integration. Feature branch merge ke sini. Build test di Vercel preview.
- `feature/<slug>` — kerja harian. Branch dari `dev`. Hapus setelah merge.

## Commit Convention (Conventional Commits)
Format: `<type>(<scope>): <subject>`

Types: `feat`, `fix`, `docs`, `chore`, `refactor`, `style`, `test`, `perf`
Scope: `frontend`, `backend`, `docs`, `infra`

Example:
```
feat(backend): add inquiry API endpoint
fix(frontend): correct date picker timezone
docs: update ROADMAP Phase 1 completion
```

## Workflow
1. `git checkout dev && git pull origin dev`
2. `git checkout -b feature/<slug>`
3. Kerja, commit, push
4. PR ke `dev` — review oleh Prime Agent
5. Merge ke `dev`, test
6. PR `dev` -> `main`, deploy

## Authorized Pushers
- Prime Agent: main, dev, feature/*
- Sub-Agent (qwen2.5-coder-14b): tidak punya akses git