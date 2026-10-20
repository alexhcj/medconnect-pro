---
id: BE-025
type: task
area: backend
feature: api-contract
status: pending
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
  status: not_started
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
- Users: `q` (name or email) and `role` filters, stable ordering.
- Claims paginate over the caller's visible invoices.
- `total` and `nextPage` reflect only rows visible to the caller (patients see own counts only).
- A coordinated or additive envelope so the current web client keeps working until FE-043/FE-045.

## Acceptance Criteria

- [ ] Calls without params return the first default-size page
- [ ] `pageSize` above 100 or `page` below 1 returns 400
- [ ] PATIENT pages contain only own rows and `total` counts only own rows
- [ ] Users list never includes another practice's users
- [ ] Filters and sort behave per the allow-lists; unknown sort values return 400
- [ ] OpenAPI regenerated; contract docs updated; unit and e2e tests pass
- [ ] Compatibility decision for the existing web client is documented

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
