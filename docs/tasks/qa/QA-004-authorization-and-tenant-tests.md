---
id: QA-004
type: task
area: qa
feature: security
status: implemented
priority: critical
estimate: 3
dependencies: [SEC-001,SEC-002,BE-003]
related_adrs: [ADR-002-tenant-isolation.md,ADR-003-authentication.md]
related_docs: [security-architecture.md]
plane:
  work_item_id: d3781561-4aca-445f-821d-188bab5230ed
  identifier: MEDCONNECT-36
---

# QA-004 — Authorization and tenant tests

## Objective

Create reusable authorization and tenant-isolation test matrix.

## Scope

Cover role × resource × tenant boundaries.

## Technical constraints

- Follow the project architecture.
- Preserve tenant and authorization boundaries.
- Use synthetic demo data only.
- Follow accessibility and responsive requirements.
- Do not introduce unnecessary dependencies.

## Acceptance criteria

- [x] Provider access tested
- [x] Nurse access tested
- [x] Receptionist restrictions tested
- [x] Patient self-scope tested
- [x] Cross-tenant access denied

## Implementation notes

This is one of the highest-value portfolio security demonstrations.

## Completion

- Implementation: No product surface change. Expected allow/deny status comes from existing
  access helpers; the HTTP matrix asserts the Nest boundary.
- Tests: Reusable two-tenant harness in `apps/api/test/authorization-matrix-harness.ts`. Table-driven
  Nest HTTP matrix in `apps/api/test/authorization-matrix.http.spec.ts` for provider, nurse,
  receptionist, patient, and practice admin against patients, clinical, documents, appointments,
  telehealth, billing, and audit, plus foreign-id not-found and client `practiceId` rejection
  (`npm run test:api` with Compose Postgres). Existing domain HTTP specs stay in place.
- PR:
- Notes: Version 0.41.0 → 0.41.1 (PATCH). Test coverage only; no API or UX contract change.
  SUPER_ADMIN cross-practice HTTP and a Playwright role matrix stay out of scope. Browser checks
  remain UX only.
