---
id: INFRA-009
type: task
area: infrastructure
feature: deployment
status: pending
priority: high
estimate: 3
dependencies: [INFRA-004, INFRA-002]
related_adrs: [ADR-009, ADR-012]
related_docs:
  [
    frontend-architecture.md,
    infrastructure-architecture.md,
    ../roadmap/release-roadmap.md,
  ]
implementation:
  status: not_started
validation:
  responsive: false
  accessibility: false
  tests_required: true
plane:
  work_item_id: 8c27482e-e1a3-49f1-96eb-41ac62faa37d
  identifier: MEDCONNECT-65
---

# INFRA-009 — AWS Amplify Hosting for Next.js

## Objective

Host `apps/web` on AWS Amplify Hosting with a monorepo build, Next.js SSR, environment-specific
API URLs, HTTPS, and production publication from `main`.

## Context

Why this task exists: M9 requires Amplify for the Next.js app. No `amplify.yml` or frontend
host exists. Marketing and the authenticated dashboard are one App Router application
(FE-017–FE-023 plus the dashboard).

Already present: `npm run build:production` sets `NEXT_PUBLIC_USE_MOCKS=false`. Live API calls
use `NEXT_PUBLIC_API_BASE_URL` / server `API_BASE_URL` and an opaque bearer in `localStorage`.

Production API URL wiring needs [INFRA-008](INFRA-008-nestjs-api-container-and-ecs-fargate.md).
The Amplify app can be scaffolded in parallel.

## Scope

- Connect an Amplify app to the GitHub repository. Configure the monorepo so install/build
  run from the repository root (workspace hoist) with the Next app in `apps/web`.
- Build: `npm ci` at the repository root, then `npm run build:production` (mocks off).
- Environment: `NEXT_PUBLIC_USE_MOCKS=false`; `NEXT_PUBLIC_API_BASE_URL` and server
  `API_BASE_URL` equal **that environment’s** API. No database URLs in Amplify.
- Keep App Router SSR/runtime. Do not static-export as a workaround.
- HTTPS via Amplify. Default hostname is `*.amplifyapp.com` unless an operator domain is
  supplied (custom domain is optional, not a blocker).
- Authentication: mock IdP stays same-origin `/login`. No OAuth redirect-URI work.
- Failed Amplify builds must not publish. Document retry.
- If any cookie is set (including the leftover dashboard-overview BFF), it must be `Secure`
  and scoped to the Amplify origin. Do not rewrite identity to cookies.

## Out of scope

- Per-PR backend (shared preview API is INFRA-010)
- Kubernetes
- Hosting the NestJS API on Amplify
- Rewriting auth to cookies or implementing OAuth
- PR preview wiring (INFRA-010) beyond leaving the app ready for branch/PR previews

## Requirements

- `main` publishes the production Amplify URL.
- Production site talks only to the production API.
- Preview Amplify env (when enabled in INFRA-010) talks only to the preview API.
- No secrets in the Amplify console beyond values that are already public `NEXT_PUBLIC_*`.
- Synthetic demo data only. Never introduce real PHI.

## Technical constraints

- Follow [ADR-009](../../decisions/ADR-009-npm-workspace-monorepo.md) and ADR-012.
- Node 24 to match `.nvmrc` / engines.
- Do not introduce Vercel, Netlify, or a second frontend host.
- Do not claim HIPAA compliance or production OAuth.

## Acceptance criteria

- [ ] `main` publishes a production Amplify URL
- [ ] The production site calls only the production API
- [ ] Marketing routes and `/login` load over HTTPS
- [ ] Amplify holds no database URLs or Secrets Manager values
- [ ] Monorepo workspace install works from the repository root
- [ ] A failed Amplify build does not replace the last successful production publish

## Dependencies

- Blocked by: INFRA-004, INFRA-002
- Production API URL: INFRA-008 (scaffold Amplify before the URL exists; do not point
  production at the preview API)
- Related: INFRA-010 (PR previews), FE-017–FE-023 (same application)

## Validation

- Browser: marketing `/`, `/login`, live login with a seeded demo user, one dashboard list
  page.
- Confirm network calls go to the intended API host (production web → production API).
- Confirm the client bundle does not contain `DATABASE_URL` or AWS keys.

## Documentation impact

- frontend-architecture hosted note
- infrastructure-architecture
- Web env examples from INFRA-004
- release-roadmap shipped/pending split when this task ships

## Risks / considerations

- Amplify SSR compute must match the current App Router (not a static export). Verify
  Next.js version compatibility with Amplify Hosting before locking the build image.
- `API_BASE_URL` is server-only (dashboard overview BFF). `NEXT_PUBLIC_API_BASE_URL` is
  public by design.
- Do not enable mocks on hosted preview or production. Interviewer demos need the live API.

## Implementation notes

Suggested implementation order: after INFRA-004; scaffold in parallel with INFRA-008; set
production `NEXT_PUBLIC_API_BASE_URL` after the production API URL exists.

Later shipping of this slice is a MINOR bump on 0.x. Writing the spec is not.

## Completion

- Implementation:
- Tests:
- PR:
- Notes: Pending M9 implementation.
