---
id: INFRA-002
type: task
area: infrastructure
feature: development-foundation
status: completed
priority: high
estimate: 1
dependencies: []
related_adrs: [ADR-007, ADR-009]
related_docs: [00-project-spec.md, frontend-architecture.md]
plane:
  work_item_id: null
  identifier: null
---

# INFRA-002 — Monorepo workspace structure

## Objective

Restructure the repository into an npm workspace with the Next.js app in `apps/web`, a reserved
`apps/api` location for NestJS, shared `/docs` and Cursor rules at the root, and a reserved
`packages/` directory.

## Scope

Repository layout and workspace configuration only. Do not initialize NestJS or extract shared
packages.

## Technical constraints

- Keep npm as the package manager.
- Do not introduce Turborepo, Nx, or another orchestrator.
- Preserve frontend behavior, mock/real API switching, and Git history where possible.
- Do not discard local working-tree changes.

## Acceptance criteria

- [x] Next.js application lives in `apps/web`
- [x] Root is a private npm workspace
- [x] Frontend scripts run from the repository root via workspace delegation
- [x] `apps/api` is a placeholder only
- [x] Documentation and Cursor rules remain at the repository root
- [x] No NestJS application initialized

## Implementation notes

See [ADR-009](../../decisions/ADR-009-npm-workspace-monorepo.md).

## Completion

- Implementation: npm workspaces + `apps/web` migration
- Tests: lint, type-check, Vitest, Next.js build from the repository root
- PR:
- Notes: Session/UI files that were previously untracked were reconstructed to match remaining
  imports after the directory move.
