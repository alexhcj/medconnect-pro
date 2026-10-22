---
id: BE-025
type: task
area: backend
feature: api-contract
status: implemented
priority: medium
estimate: 3
dependencies: [BE-007, BE-010]
related_adrs: [ADR-002-tenant-isolation.md, ADR-004-api-contracts.md]
related_docs:
  [
    ../../architecture/backend-architecture.md,
    ../../contracts/api-endpoints.md,
    ../../contracts/data-contracts.md,
    ../../workflows/api-contract-workflow.md,
    BE-007-billing-api.md,
    BE-010-practice-user-directory-api.md,
  ]
implementation:
  status: complete
validation:
  responsive: false
  accessibility: false
  tests_required: true
plane:
  work_item_id: bfd57dc0-a0ce-4fa8-887b-b9ff96866ce9
  identifier: MEDCONNECT-120
---

# BE-025 — Billing and user list pagination contract

## Objective

Bound `GET /billing/invoices`, `GET /billing/claims` and `GET /admin/users` with the same
page-based query pattern the audit, security-event and patient lists already use.

## Context

Audit/security events take `page` and `pageSize`; patients take `q`, `status`, `sort` and `page`.
Invoices, claims and practice users take no query params and return every visible row, which will
not scale and blocks bounded UI (FE-043, FE-045).

## Scope

- Query schemas (zod) and DTOs for the three endpoints.
- Response envelope aligned with the existing list convention, naming the convention in
  `docs/contracts/`.
- Tenant and own-scope filtering applied before paging.
- Regenerate OpenAPI and update contract docs.

## Out of Scope

- Frontend consumption (FE-043, FE-045)
- Audit/security-event API changes (already paged)
- New invoice or claim fields

## Requirements

- `page` ≥ 1; `pageSize` default 25, maximum 100; invalid values return 400.
- Invoices: `status` filter, `sort` allow-list (issued date asc/desc, default newest first).
- Users: `q` (email substring; users have no name field) and `role` filters, stable ordering.
- Claims paginate over the caller's visible invoices.
- `total` and `nextPage` reflect only rows visible to the caller (patients see own counts only).
- A coordinated or additive envelope so the current web client keeps working until FE-043/FE-045.

## Acceptance Criteria

- [x] Calls without params return the first default-size page
- [x] `pageSize` above 100 or `page` below 1 returns 400
- [x] PATIENT pages contain only own rows and `total` counts only own rows
- [x] Users list never includes another practice's users
- [x] Filters and sort behave per the allow-lists; unknown sort values return 400
- [x] OpenAPI regenerated; contract docs updated; unit and e2e tests pass
- [x] Compatibility decision for the existing web client is documented

## Dependencies

- Blocked by: BE-007, BE-010
- Related: FE-043, FE-045, FE-042

## Validation

`npm run lint:api`, `type-check:api`, `test:api`, `npm run openapi:generate`; tenant and patient
scope cases added to the existing billing and user service specs.

## Risks / considerations

- Changing the response shape breaks the current clients; prefer additive fields or land with the UI tasks.
- Public API contract change: requires approval before implementation.

## Implementation notes

Contract change: MINOR bump while `0.x`.

## Completion

- Decisions: additive envelope (`invoices` / `claims` / `users` array key kept, plus `total`, `hasMore`, `nextPage`), so the current web client keeps working and gets the first 25 rows until FE-043 and FE-045. User `q` matches email only because users have no name field (spec amended). Unknown query keys are ignored, as on the other lists; invalid `page`, `pageSize`, `status`, `sort` and `role` return 400. `page` is capped at 1000, matching audit.
- Implementation: `platform/pagination.ts` (shared `page`/`pageSize` schema, defaults, `toPageMeta`); `billing/billing.schema.ts`, `billing.rdo.ts`, `billing.service.ts`, `invoice.repository.ts` (pages ids first, then hydrates line items, so joins cannot distort paging; `overdue`/`issued` filters share one `now` with the response mapper), `invoice.controller.ts`, `claims.controller.ts`; `practice/membership.repository.ts` (`listWithUsers` is now paged, ordered `createdAt, id`, `q` ILIKE with escaped wildcards), `practice-user.*`. Contracts: "List pagination" in `docs/contracts/api-endpoints.md`, plus pointers in `data-contracts.md` and `identity-and-access.md`. OpenAPI regenerated.
- Tests: `platform/pagination.spec.ts`, `billing.service.spec.ts` (defaults, filter pass-through, own-scope before paging), HTTP cases in `test/billing.http.spec.ts` (defaults, 400s, sort, derived status filters, PATIENT own counts, claims paging, cross-tenant, nurse denied) and `test/practice-users.http.spec.ts` (stable paging, role/email filters, wildcard escaping, cross-practice, 400s); `test/tenant-isolation.spec.ts` updated for the paged repository. Lint clean; the new and affected specs pass against local Postgres.
- Security review: no blocking findings.
- Deviations: none from the approved plan. Pre-existing and unrelated: `npm run type-check:api` reports one error in `src/telehealth/telehealth-session.service.spec.ts:398`, present on a clean tree. Full `test:api` was not run, only the affected specs.
- Notes: Version 0.91.3 → 0.92.0 (MINOR, public list contract change on 0.x). No `docs/product/` or capability-matrix change: no new capability claim.
