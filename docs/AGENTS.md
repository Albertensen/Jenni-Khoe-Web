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

## 4. Task Sizing & Dispatch Protocol (Context-Limited Models)

### Model Constraints
| Agent | Model | Context Limit | Failure Mode |
|-------|-------|---------------|--------------|
| @qwen | Qwen 2.5 Coder 14B (local) | ~32K token | Stuck on multi-file/multi-step tasks |
| @gemini | Gemini Flash | rate-limited | 429 on large payloads |
| @qa_testing | (varies) | - | - |

### One Turn = One Unit Rule
**Never dispatch ≥2 logical units in one turn.** One unit =:
- 1 file write, OR
- 1 migration, OR
- 1 model/controller, OR
- 1 component, OR
- 1 bug fix

### Dispatch Matrix (Who Gets What)
| Payload Size | Queue To |
|--------------|----------|
| ≤1 file / small task | @qwen |
| 2-5 files, related | Split: @qwen half, @gemini half |
| ≥5 files / large synthesis | @hermes or @gemini leads, @qwen executes pieces |
| UI/design components | @gemini → hands off to @qwen one at a time |
| Backend logic | @hermes spec → @qwen implements one endpoint at a time |

### Anti-Stuck Rules
1. Spec must be FINAL before dispatch — no iterative refinement mid-task
2. Never send full docs as input — reference file path only: "read `docs/ARCHITECTURE.md` §3, implement webhook controller"
3. If @qwen silent 1 turn → re-dispatch with smaller unit
4. If @qwen silent 2 turns → @hermes or @gemini takes over task
5. @gemini input capped at 1 design spec per turn (avoid 429)
6. Long content via file reference — write spec to file first, then mention path

## 5. Error Escalation

```
QA fails audit → @qwen fix locally → retry → if fails again → escalate to @hermes for design review
```

- Escalation bypasses if the error is in architecture spec itself
- @qa_testing: first failure stops — no full analysis waste