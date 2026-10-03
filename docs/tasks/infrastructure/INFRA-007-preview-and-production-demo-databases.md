---
id: INFRA-007
type: task
area: infrastructure
feature: deployment
status: pending
priority: high
estimate: 3
dependencies: [INFRA-004, INFRA-006, DATA-001]
related_adrs: [ADR-005, ADR-010, ADR-012]
related_docs:
  [
    data-architecture.md,
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
  work_item_id: null
  identifier: null
---

# INFRA-007 — Preview and production demo databases

## Objective

Provision and operate isolated preview/demo and production/demo PostgreSQL instances, with
migrations, synthetic seed data, and connection guards.

## Context

Why this task exists: local Compose is not a hosted database. Document upload/list and RLS
require a real Postgres with the `medconnect_app` runtime role.

Already present: `docker-compose.yml` Postgres 16, TypeORM migrations, `synchronize: false`,
`npm run migration:run`, `npm run seed:mock-identity` (synthetic only).

This project uses **synthetic/demo data only**. Preview and production databases are demo
databases. They must never contain real PHI.

## Scope

- Two RDS PostgreSQL instances (or equivalent isolated instances) in private subnets.
- Same role split as local: table owner on `DATABASE_ADMIN_URL` (migrate/seed),
  `medconnect_app` on runtime `DATABASE_URL`.
- Deploy-time `migration:run` against the **target** admin URL. `synchronize: false` remains.
- Seed synthetic `seed:mock-identity` on first initialization. Never load real PHI.
- Encryption at rest with AWS-managed RDS keys. No custom KMS project.
- Automated backup sufficient for a demo rollback (RDS snapshot or PITR as offered by a small
  instance class).
- Guard: preview application configuration cannot point at the production database;
  production cannot point at preview or local URLs (enforced by INFRA-004 fail-closed rules
  plus distinct secret names from INFRA-006).

## Out of scope

- Multi-AZ enterprise disaster recovery
- Read replicas
- Redis / ElastiCache
- Mixing preview data into production
- Per-PR ephemeral databases
- Implementing the ECS service (INFRA-008)

## Requirements

- Three named databases: local Compose, preview/demo RDS, production/demo RDS.
- Migrations apply to the intended instance only.
- Seed data is the existing synthetic fixture set.
- Hosted instances are not reachable as public `0.0.0.0/0` Postgres. Application and migrate
  tasks reach them from the VPC.
- Do not commit connection strings with real passwords.

## Technical constraints

- Follow [ADR-010](../../decisions/ADR-010-postgresql-typeorm.md) and
  [ADR-005](../../decisions/ADR-005-synthetic-demo-data.md).
- Preserve RLS and the non-owner runtime role ([SEC-002](../security/SEC-002-tenant-isolation.md)).
- Keep Terraform small: networking needed for RDS plus the instances themselves. Do not start
  a generic module library.
- Do not claim HIPAA compliance.

## Acceptance criteria

- [ ] Local, preview/demo, and production/demo databases are documented and provisioned
- [ ] Migrations apply on deploy to the intended instance
- [ ] Seed data is synthetic; the runbook restates no real PHI
- [ ] Mis-pointed connection URLs fail closed (INFRA-004 rules + distinct secrets)
- [ ] Runtime remains `medconnect_app`; owner URL is migrate/seed only

## Dependencies

- Blocked by: INFRA-004, INFRA-006, DATA-001
- Related: INFRA-008, INFRA-013, ADR-005, SEC-002
- Unblocks: INFRA-008 (API must have a database to become ready)

## Validation

- Run a one-off migrate/seed task against preview, then production, using each environment’s
  admin secret.
- After INFRA-008 exists, `GET /ready` against that environment’s API.
- Confirm seeded users are the documented demo accounts, not real identities.

## Documentation impact

- data-architecture hosted-database note
- infrastructure-architecture
- Deploy runbook (migrate/seed, three-DB rule, no-PHI)
- release-roadmap shipped/pending split when this task ships

## Risks / considerations

- `DATABASE_URL` pointed at the table owner bypasses RLS. Hosted runtime must use
  `medconnect_app`.
- First-init seed is safe; re-running seed on a dirty database must not invent a second
  identity model. Document idempotence or “run once.”
- Small instance class is enough for a portfolio demo. Do not size for production PHI load.

## Implementation notes

Suggested implementation order: after INFRA-006, before INFRA-008.

Operator prerequisite: AWS account and VPC from the M9 Terraform root (this task may introduce
that root if INFRA-006 only bootstrapped secrets).

Later shipping of this slice is a MINOR bump on 0.x. Writing the spec is not.

## Completion

- Implementation:
- Tests:
- PR:
- Notes: Pending M9 implementation.
