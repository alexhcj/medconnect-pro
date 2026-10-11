---
id: QA-005
type: task
area: qa
feature: security
status: implemented
priority: high
estimate: 3
dependencies: [SEC-009, QA-004]
related_adrs: [ADR-002-tenant-isolation.md]
related_docs:
  [
    ../../architecture/security-architecture.md,
    ../../contracts/identity-and-access.md,
    ../security/SEC-009-m17-security-findings-and-contract-reconciliation.md,
    QA-004-authorization-and-tenant-tests.md,
  ]
implementation:
  status: complete
validation:
  responsive: false
  accessibility: false
  tests_required: true
plane:
  work_item_id: 20c5507f-670a-4839-8b89-bd2924e6d6ea
  identifier: MEDCONNECT-107
---

# QA-005 — Authorization and tenant regression expansion

## Objective

Extend the reusable Nest HTTP authorization matrix with high-value negatives that QA-004 left
out of scope, matching shipped access helpers and ADR-016 session-tenant SUPER_ADMIN.

## Context

[QA-004](QA-004-authorization-and-tenant-tests.md) covers provider, nurse, receptionist, patient,
and practice admin against core resources, plus foreign-id 404 and client `practiceId` rejection.
Completion notes left SUPER_ADMIN cross-practice HTTP and a Playwright role matrix out of scope.
M17 does **not** implement cross-practice SUPER_ADMIN ([SEC-009](../security/SEC-009-m17-security-findings-and-contract-reconciliation.md)
/ ADR-016). Several existing HTTP behaviors are proven in domain specs but not in
[`authorization-matrix.http.spec.ts`](../../../apps/api/test/authorization-matrix.http.spec.ts):
same-practice other-provider telehealth join/mint, Nest end then mint, cross-practice payment
POST, receptionist clinical history deny.

This task covers **existing** HTTP. It does not wait on BE-022, BE-023, or FE-036.

## Scope

Extend the table-driven matrix (and harness only if needed):

- SUPER_ADMIN **session-tenant**: can read in-session practice resources they are bound to; a
  foreign-practice patient/invoice/session id returns the same not-found as other roles. Do **not**
  add a cross-practice allow case.
- Same-practice provider who is **not** the appointment provider (and not an assigned nurse)
  cannot join or mint (403/404 as `telehealth-access.ts` dictates).
- After Nest `POST .../end`, mint returns 409 (`SESSION_ENDED` / `SESSION_NOT_JOINABLE` as
  implemented).
- Cross-practice `POST /billing/payments` against a foreign invoice id → 404 (no oracle).
- Receptionist `GET` clinical history → 403, in the matrix (not only `clinical.http.spec.ts`).

Keep existing domain HTTP specs. Browser checks remain UX only.

## Out of Scope

- Playwright full role matrix
- Implementing SUPER_ADMIN cross-practice or a practice switcher
- Changing PROVIDER billing to care-team-only
- New product routes (session inventory and clinical read audit have their own tests)
- AWS, real PHI

## Requirements

- Expected allow/deny status comes from existing access helpers and ADR-016, not from this task
  inventing a second matrix.
- Unknown and cross-tenant ids deny without confirming existence.
- Synthetic demo data only.

## Acceptance Criteria

- [x] SUPER_ADMIN session-tenant allow/deny cases are in the HTTP matrix
- [x] Same-practice other-provider telehealth join and mint are denied in the matrix
- [x] Nest end then mint is 409 in the matrix
- [x] Cross-practice payment POST is 404 in the matrix
- [x] Receptionist clinical history GET is 403 in the matrix
- [x] QA-004 cases still pass; `npm run test:api` with Compose Postgres

## Dependencies

- SEC-009, QA-004
- Independent of BE-022, BE-023, FE-036

## Validation

- [`authorization-matrix.http.spec.ts`](../../../apps/api/test/authorization-matrix.http.spec.ts)
- [`authorization-matrix-harness.ts`](../../../apps/api/test/authorization-matrix-harness.ts)
- `npm run test:api`

## Risks / Considerations

- Tests only: **PATCH** unless bundled with a MINOR API task in the same change.
- Do not treat matrix coverage as HIPAA certification.

## Implementation notes

Reuse the two-tenant harness. Add seed/setup only when the current fixtures cannot express
“other provider in the same practice.”

Writing this spec is not a version bump.

## Completion

- Implementation: No product surface change. Expected allow/deny status comes from existing access
  helpers and ADR-016. The HTTP matrix now includes session-tenant SUPER_ADMIN reads, foreign
  patient/invoice/session deny, same-practice other-provider join and mint deny, receptionist end
  then provider mint (`409` `SESSION_NOT_JOINABLE`), receptionist cross-practice payment POST
  (`404`), and receptionist clinical history GET (`403`).
- Tests: `apps/api/test/authorization-matrix-harness.ts` and
  `apps/api/test/authorization-matrix.http.spec.ts`. `npm run test:api` with Compose Postgres
  (72 files, 585 tests). Existing domain HTTP specs stay in place.
- PR:
- Notes: Version 0.84.0 → 0.84.1 (PATCH). Test coverage only; no API or UX contract change.
  The end-then-mint appointment sits in the adjacent slot before the shared join appointment so
  the provider exclusion constraint allows both, and that slot is still inside the join grace.
  Playwright role matrix and cross-practice SUPER_ADMIN stay out of scope. M17 is not closed.
