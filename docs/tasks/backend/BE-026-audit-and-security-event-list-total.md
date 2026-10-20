---
id: BE-026
type: task
area: backend
feature: api-contract
status: complete
priority: medium
estimate: 1
dependencies: [BE-025]
related_adrs: [ADR-004-api-contracts.md]
related_docs:
  [
    ../../architecture/backend-architecture.md,
    ../../contracts/api-endpoints.md,
    ../../workflows/api-contract-workflow.md,
    BE-025-billing-and-user-list-pagination-contract.md,
    ../frontend/FE-043-administration-paginated-lists.md,
  ]
implementation:
  status: complete
validation:
  responsive: false
  accessibility: false
  tests_required: true
plane:
  work_item_id: e87aaea7-42e6-45f3-a794-b7dde3c2849a
  identifier: MEDCONNECT-124
---

# BE-026 — Audit and security-event list total

## Objective

Return `total` on the audit-event and security-event list responses so the UI can show a range
label such as "26–50 of 312", matching the envelope BE-025 gave invoices, claims and users.

## Context

Audit and security-event lists already accept `page` and `pageSize` and return `hasMore` and
`nextPage`, but predate `total` (`docs/contracts/api-endpoints.md`, "List pagination"). The
repository already computes the count (`getManyAndCount` in `audit-event.repository.ts`) and
discards it. FE-043 needs `total` for range labels and numbered paging.

## Scope

- Add `total` to the audit-event and security-event list response DTOs and mapper.
- Count only rows visible to the caller that match the active filters, applied before paging.
- Regenerate OpenAPI; update the "List pagination" section of `docs/contracts/api-endpoints.md`.

## Out of Scope

- New query parameters, including sort (a later task may add it)
- Frontend consumption (FE-043)
- Changes to patients or appointments list envelopes

## Requirements

- Additive: existing fields and the current web client keep working.
- `total` is tenant-scoped and reflects filters; a page past the end returns an empty array with
  the same `total`.
- No extra count query when the repository already returns one.

## Acceptance Criteria

- [x] Audit and security-event list responses include `total`
- [x] `total` honours action, resource type and date filters
- [x] `total` never counts another practice's events
- [x] A page past the end returns `[]` with the unchanged `total`
- [x] OpenAPI regenerated; contract docs updated; unit and e2e tests pass

## Dependencies

- Blocked by: BE-025 (shared pagination convention)
- Blocks: FE-043 (range label with total)

## Validation

`npm run lint:api`, `type-check:api`, `test:api`, `npm run openapi:generate`; add cases to the
existing audit service and HTTP specs.

## Risks / considerations

- Public API contract change: requires approval before implementation.

## Implementation notes

Contract change: MINOR bump while `0.x`.

## Completion

- Decisions: additive. `total` is passed through from the `getManyAndCount` the audit repository already ran (via the shared `toPageMeta`), so there is no extra query. Default `pageSize` stays 50 and no query params changed.
- Implementation: `audit/audit-event.repository.ts`, `audit.rdo.ts`, `audit.service.ts`, controller descriptions in `audit.controller.ts` and `security-events.controller.ts`. OpenAPI regenerated. Contracts: "List pagination" in `docs/contracts/api-endpoints.md`, pointer in `data-contracts.md`.
- Tests: new total/filter/tenant/past-the-end case in `audit-event.repository.spec.ts`; `total` and past-the-end assertions in `test/audit.http.spec.ts` and `test/security-events.http.spec.ts`. These three specs pass against local Postgres; lint clean. No audit service spec exists, so none was added.
- Security review: no findings.
- Deviations: none. Pre-existing and unrelated: `npm run type-check:api` reports one error in `src/telehealth/telehealth-session.service.spec.ts:398`. Full `test:api` was not run.
- Notes: Version 0.92.0 → 0.93.0 (MINOR, public list contract change on 0.x). No `docs/product/` or capability-matrix change.
