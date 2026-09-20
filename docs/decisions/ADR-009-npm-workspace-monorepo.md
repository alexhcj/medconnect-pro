# ADR-009 — npm workspace monorepo

## Status

Accepted

## Decision

MedConnect Pro is an **npm workspaces** monorepo.

- `apps/web` — Next.js frontend (current application).
- `apps/api` — reserved for the NestJS backend; not initialized in this decision.
- `packages/` — reserved for future shared packages; no extraction until a concrete cross-app reuse need exists.
- `/docs` and `.cursor/rules/` remain at the repository root.
- The package manager stays **npm**. No Turborepo, Nx, or pnpm migration.

Root `package.json` is private, lists `workspaces: ["apps/*", "packages/*"]`, and delegates
frontend scripts with `npm run <script> -w medconnect-web`. Application dependencies live in
`apps/web`, not at the root.

The `@docs/*` TypeScript/Vitest alias in `apps/web` points at the repository `/docs` tree so mock
fixtures stay canonical and unduplicated.

## Rationale

The frontend and planned backend must be independently maintainable without splitting
documentation or Cursor rules. A basic npm workspace is enough until more than one installable
package exists.

## Consequences

- Install from the repository root (`npm install`).
- Next.js env files live next to the Next project in `apps/web`.
- Canonical demo version remains the **root** `package.json` version ([ADR-007](ADR-007-semantic-versioning.md)).
- NestJS is added later under `apps/api` without another repository restructure.
