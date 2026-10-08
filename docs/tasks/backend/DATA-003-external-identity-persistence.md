---
id: DATA-003
type: task
area: backend
feature: identity-access
status: pending
priority: high
estimate: 2
dependencies: [DATA-001, SEC-006]
related_adrs: [ADR-003-authentication.md, ADR-010-postgresql-typeorm.md]
related_docs:
  [
    ../../architecture/data-architecture.md,
    ../../contracts/identity-and-access.md,
    DATA-001-postgresql-tenant-model.md,
    BE-009-identity-and-access-http.md,
  ]
implementation:
  status: not_started
validation:
  responsive: false
  accessibility: false
  tests_required: true
plane:
  work_item_id: baecdaa0-2e9a-45db-8a27-3df757697da1
  identifier: MEDCONNECT-91
---

# DATA-003 — External identity and OAuth flow-state persistence

## Objective

Add the persistence that M14 OIDC needs: a link from an external `(provider, subject)` to an
internal user, and one-time flow state for the authorization redirect.

## Context

`users` has only `id` and `email`. Sessions live in `auth_sessions`. Identity-resolution tables
have no RLS so login can derive tenant ([data-architecture.md](../../architecture/data-architecture.md)).
Model decided in [SEC-006](../security/SEC-006-oidc-bff-contract-and-adr.md) / ADR-014.

## Scope

- Entity + migration `external_identities`: `id`, `user_id` (FK `users`, cascade restrict),
  `provider` (varchar), `subject` (varchar), `email_at_link` (nullable), timestamps.
  Unique `(provider, subject)`; unique `(user_id, provider)`.
- Entity + migration `oauth_flow_states`: `id`, `provider`, `state_hash` (unique),
  `code_verifier`, `nonce`, `return_to`, `expires_at`, `consumed_at` (nullable), `created_at`.
- No RLS on either table (identity-resolution). Runtime role `medconnect_app` grants match
  `auth_sessions`.
- Repository methods: find by `(provider, subject)`, find by `(user_id, provider)`, insert link;
  create flow state, atomically consume by `state_hash` (rejects expired or consumed).
- Update `data-architecture.md` table list.

## Out of Scope

- HTTP routes, provider adapters, UI (BE-017, FE-033)
- Unlinking, multiple identities per provider, provider token storage
- Redis

## Acceptance Criteria

- [ ] Migrations apply and revert on Compose PostgreSQL
- [ ] Duplicate `(provider, subject)` and duplicate `(user_id, provider)` fail at the database
- [ ] Consume is one-time: second consume and expired state both return nothing
- [ ] `state` is stored only as a hash
- [ ] Runtime role can read/write both tables; no RLS policies added
- [ ] `npm run test:api` passes

## Dependencies

- DATA-001 (shipped), SEC-006
- Blocks: BE-017

## Validation

- Repository specs against the test database
- Migration up/down

## Risks / Considerations

- Expired flow rows accumulate; a cheap delete-expired on create is enough for the demo.
