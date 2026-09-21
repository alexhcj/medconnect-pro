---
id: INFRA-001
type: task
area: infrastructure
feature: development-foundation
status: completed
priority: medium
estimate: 1
dependencies: []
related_adrs: [ADR-006, ADR-009]
related_docs: [infrastructure-architecture.md]
plane:
  work_item_id: null
  identifier: null
---

# INFRA-001 — Local development foundation

## Objective

Create reproducible local development conventions, environment handling and basic project validation.

## Scope

Document local setup, environment conventions and validation commands.

## Technical constraints

- Follow the project architecture.
- Preserve tenant and authorization boundaries.
- Use synthetic demo data only.
- Follow accessibility and responsive requirements.
- Do not introduce unnecessary dependencies.

## Acceptance criteria

- [x] Local setup documented
- [x] Environment example exists
- [x] Lint/type-check/build workflow documented
- [x] No secrets committed

## Implementation notes

Start frontend-only; backend containers can be introduced when backend work begins.

## Completion

- Implementation: README setup, `apps/web/.env.example`, gitignore for local env files, Node 24
  engines / `.nvmrc`, cross-platform `scripts/reset-local.mjs`, local vs target note in
  infrastructure architecture
- Tests: `git check-ignore` on local env files; type-check and Next.js build from the repository
  root. `npm run lint` currently fails on a pre-existing typescript-eslint / TypeScript 7
  incompatibility (not introduced by this task).
- PR:
- Notes: Docker Compose and GitHub Actions remain deferred. Leftover root `src/` (if present) is
  out of this task.
