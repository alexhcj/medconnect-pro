---
id: DATA-004
type: task
area: backend
feature: api-protection
status: implemented
priority: high
estimate: 1
dependencies: [SEC-007, DATA-001]
related_adrs: [ADR-010-postgresql-typeorm.md, ADR-015-rate-limiting-and-api-protection.md]
related_docs:
  [
    ../../architecture/data-architecture.md,
    ../security/SEC-007-rate-limit-and-api-protection-contract.md,
  ]
implementation:
  status: done
validation:
  responsive: false
  accessibility: false
  tests_required: true
plane:
  work_item_id: 00b8820b-94ae-48f1-bd5d-c5264e0d7360
  identifier: MEDCONNECT-95
---

# DATA-004 — Rate-limit bucket persistence

## Objective

Provide a PostgreSQL table and atomic counter for fixed-window rate limiting, per ADR-015.

## Scope

- TypeORM migration + entity `rate_limit_buckets` (`policy`, `key_hash`, `window_start`, `count`,
  `expires_at`); primary key on `policy` + `key_hash` + `window_start` (ADR-015 keys buckets by
  policy); index on `expires_at`; `key_hash` constrained to 64 lowercase hex characters.
- Least-privilege grant: the app role gets `SELECT, INSERT, UPDATE, DELETE` on this table only.
- Repository `increment(policy, keyHash, windowMs, now)` using a single
  `INSERT ... ON CONFLICT DO UPDATE ... RETURNING count` returning `{count, resetAt}`.
- Prune expired rows (bounded delete on increment or on a cheap interval).
- No tenant column; RLS not applicable (recorded in ADR-015).

## Out of Scope

- Guard, policies, HTTP behavior (BE-018, BE-019)
- Redis

## Acceptance Criteria

- [x] Migration runs and reverts cleanly on Docker Postgres
- [x] Concurrent increments on one key produce no lost updates
- [x] A new window resets the count; expired rows are pruned
- [x] The app role has no new grants beyond `rate_limit_buckets`
- [x] Only hashed keys are stored

## Dependencies

- SEC-007, DATA-001
- Blocks: BE-018

## Validation

- `npm run migration:run` / `migration:revert` in `apps/api`
- Vitest persistence spec `apps/api/test/rate-limit-bucket.persistence.spec.ts` (pattern:
  `apps/api/test/external-identity.persistence.spec.ts`)

## Risks / Considerations

- One write per limited request; acceptable because only selected routes are limited.
- PATCH version bump.

## Completion

Shipped in 0.77.1. Migration `1760000000012-RateLimitBuckets`, entity `RateLimitBucket`, and
`RateLimitBucketRepository` (`apps/api/src/rate-limit/`). Increment prunes up to 500 expired rows
before the upsert. The hex `CHECK` and a repository guard reject raw keys. The spec covers
sequential and 50-way concurrent increments, window reset, policy independence, pruning, hash-only
storage, grants, and absence of RLS.
