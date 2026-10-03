---
id: INFRA-004
type: task
area: infrastructure
feature: deployment
status: pending
priority: high
estimate: 2
dependencies: [INFRA-001, INFRA-002, DATA-001]
related_adrs: [ADR-005, ADR-010, ADR-012]
related_docs:
  [
    infrastructure-architecture.md,
    security-architecture.md,
    ../roadmap/release-roadmap.md,
    ../roadmap/post-mvp-baseline.md,
  ]
implementation:
  status: not_started
validation:
  responsive: false
  accessibility: false
  tests_required: true
plane:
  work_item_id: 2c286b2a-5a93-4194-87c6-5feacea722d6
  identifier: MEDCONNECT-60
---

# INFRA-004 — Environment separation and configuration contract

## Objective

Define and enforce a clear separation between local, preview, and production: public configuration
versus environment-specific configuration versus secrets, and isolated databases.

## Context

Why this task exists: the repository only has local `.env.example` files. Architecture still names
development / staging / production. Hosted preview and production cannot start from that mismatch.
This is the first M9 task and the contract the rest of the milestone implements.

Already present and must not be redone: [INFRA-001](INFRA-001-local-development-foundation.md)
local examples and gitignore; Compose demo Postgres; API Zod env schema with local URL fallbacks
in `apps/api/src/platform/env.schema.ts`.

## Scope

- Write [ADR-012](../../decisions/ADR-012-deployment-topology.md) for M9 topology: Amplify Hosting
  for Next.js, ECS Fargate for NestJS, local / preview / production, shared preview API +
  preview/demo database, production API + production/demo database.
- Update [infrastructure-architecture.md](../../architecture/infrastructure-architecture.md)
  environments from development / staging / production to local / preview / production.
- Catalog every runtime variable (web + API) as public, environment-specific, or secret. Do not
  duplicate OpenAPI schemas.
- Add committed placeholder examples:
  `apps/api/.env.preview.example`, `apps/api/.env.production.example`, and matching web examples.
- Introduce `APP_ENV=local|preview|production`. Preview and production keep `NODE_ENV=production`.
- Fail closed in preview/production: no local `DATABASE_URL` / `DATABASE_ADMIN_URL` fallback;
  reject known Compose demo credentials.
- Define the CORS contract: localhost, Amplify production origin, and Amplify preview host
  pattern. Parser implementation may land in [INFRA-008](INFRA-008-nestjs-api-container-and-ecs-fargate.md).
- Document the three-database rule and synthetic/demo-data-only / no-PHI rule.

## Out of scope

- Provisioning AWS, Amplify, ECS, or RDS
- OAuth / OIDC, Redis, SNS/SQS, EKS
- Rewriting live auth from bearer + `localStorage` to cookies
- Inventing JWT, payment, or OAuth client secrets that do not exist in the application

## Requirements

- Local never requires cloud credentials.
- Preview never reads production secrets or the production database.
- Production never reads local or preview credentials.
- `NEXT_PUBLIC_*` stays public. `API_BASE_URL` and `NEXT_PUBLIC_API_BASE_URL` are
  environment-specific, not secrets.
- Current secret inventory (do not invent unused secrets): `DATABASE_URL`,
  `DATABASE_ADMIN_URL`. No JWT signing secret, payment processor key, or OAuth client secret
  exists today.
- Synthetic demo data only. Never introduce real PHI.

## Technical constraints

- Follow the project architecture and [ADR-005](../../decisions/ADR-005-synthetic-demo-data.md).
- Preserve tenant and authorization boundaries.
- Do not commit secrets. Real `.env` copies stay gitignored (`!.env.example` and
  `!**/.env.example` already exist).
- Do not introduce unnecessary dependencies.
- Do not claim HIPAA compliance.

## Acceptance criteria

- [ ] ADR-012 is accepted and referenced from infrastructure and security architecture
- [ ] An environment-variable catalog exists in `/docs` (not a copy of OpenAPI)
- [ ] Preview and production env examples are committed with placeholders only
- [ ] Real `.env` / `.env.preview` / `.env.production` files remain gitignored
- [ ] The API refuses to boot when `APP_ENV` is `preview` or `production` and database URLs are
      missing or match known local Compose credentials
- [ ] Local, preview/demo, and production/demo databases are named and the no-PHI rule is explicit

## Dependencies

- Blocked by: INFRA-001, INFRA-002, DATA-001 (completed)
- Related: INFRA-005–INFRA-013, SEC-001, ADR-005, ADR-010
- Creates: ADR-012

## Validation

- Unit-test the fail-closed env rules (missing URL, Compose demo URL, valid hosted URL).
- `git check-ignore` on non-example env files.
- Editorial review that ADR-012 matches this task and does not introduce Kubernetes or a
  per-PR backend.

## Documentation impact

- New ADR-012
- [infrastructure-architecture.md](../../architecture/infrastructure-architecture.md)
- [security-architecture.md](../../architecture/security-architecture.md) secrets section
- API and web env examples
- Root README local-versus-hosted note
- [release-roadmap.md](../../roadmap/release-roadmap.md) shipped/pending split for this ID

## Risks / considerations

- `env.schema.ts` currently defaults to local Compose URLs. Hosted boot must fail closed or a
  misconfigured service will silently target localhost.
- CORS remains a single string today (`WEB_ORIGIN`). The contract here must allow an origin list
  or preview-host pattern without letting the production browser origin use preview credentials.
- Do not treat the incomplete dashboard-overview BFF cookie as production session infrastructure.

## Implementation notes

Suggested implementation order for M9: this task first. INFRA-005 may run in parallel.

Do not provision AWS in this task. Later shipping of this slice is a MINOR bump on 0.x
([ADR-007](../../decisions/ADR-007-semantic-versioning.md)); writing the spec is not.

## Completion

- Implementation:
- Tests:
- PR:
- Notes: Pending M9 implementation.
