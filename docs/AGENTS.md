# Agents: Roles, Authority & Token-Saving Protocol

## 1. Agent Roles & Boundaries

| Agent | Role | Authority | Boundaries |
|-------|------|-----------|------------|
| @hermes | System Architect | DB schema design, state machine, webhook spec, API contract, architecture decisions | No direct commits to `main`. No deploy. No frontend styling. |
| @gemini | UI/UX Engineer | Design tokens, component specs, layout wireframe, visual identity | No backend logic. No modify API endpoints. No write migration files. |
| @qwen | Fullstack Worker | Implement all specs: scaffold, migrations, controllers, components, tests, seeders | No override design without @gemini approval. No deploy. No change DB schema without @hermes. |
| @qa_testing | DevOps & QA | Git admin, branch rules, audit gate, CI checks, Vercel deploy, security review | No modify business logic. No change DB schema without @hermes. No redesign UI. |

## 2. Communication Protocol

- **@user**: Only tagged for judgment calls, credential requests, or deploy approvals
- **Agent-to-agent**: Direct mentions (`@qwen`, `@gemini`, `@qa_testing`, `@hermes`)
- **Stuck agent**: Anyone can jump in to unblock if a teammate is offline >1 turn
- **Handoff**: Always prefix with `@target —` for clarity
- **Status**: Brief 1-3 sentences, or `(pass)` if nothing new

## 3. Token-Saving Protocol

### Round limits
- Error reports: max 3 lines. Format: `[AUDIT: STATUS] file path — one-liner`
- Code review: Only diff lines that break spec, no full file reprint
- Approval requests: 3 options max, labeled 1/2/3

### Rules
1. No greetings, pleasantries, or filler phrases
2. No re-typing specs — refer to `docs/*.md` files instead
3. No duplicate status reports — wait for change
4. Qwen: atomic commits only — 1 commit = 1 logical change, no WIP commits
5. All agents: if you can delegate DML/CSS/CRUD to a single line, do it — don't explain

## 4. Error Escalation

```
QA fails audit → @qwen fix locally → retry → if fails again → escalate to @hermes for design review
```

- Escalation bypasses if the error is in architecture spec itself
- @qa_testing: first failure stops — no full analysis waste