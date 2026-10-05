---
id: BE-011
type: task
area: backend
feature: dashboard
status: implemented
priority: high
estimate: 3
dependencies: [BE-009, DATA-002]
related_adrs: [ADR-002-tenant-isolation.md, ADR-004-api-contracts.md]
related_docs:
  [
    ../../architecture/backend-architecture.md,
    ../../architecture/api-architecture.md,
    ../../contracts/api-endpoints.md,
    ../../contracts/identity-and-access.md,
    ../../product/analytics.md,
    BE-009-identity-and-access-http.md,
  ]
implementation:
  status: complete
validation:
  responsive: false
  accessibility: false
  tests_required: true
plane:
  work_item_id: 74918c83-e1d2-4cd4-897e-39be5d0e77ad
  identifier: MEDCONNECT-74
---

# BE-011 — Dashboard overview API

## Objective

Implement contracted `GET /dashboard/overview` in Nest so live dashboard cards aggregate from
the session tenant instead of mock fixtures or a missing route.

## Context

[api-endpoints.md](../../contracts/api-endpoints.md) lists `GET /dashboard/overview` as planned.
There is no dashboard controller. Live Next.js
`apps/web/src/app/api/dashboard/overview/route.ts` is a leftover cookie BFF; deleting it is
[FE-024](../frontend/FE-024-live-dashboard-overview.md).

Mock cards in `docs/mocks/dashboard.json` include marketing numbers (2,834 patients) and a
`patient_satisfaction` metric with no Nest domain. Live values must be honest aggregates.

Implements / extends `analytics.overview-api`.

## Scope

- Nest module/controller/service for `GET /dashboard/overview`
- Session-tenant aggregation from existing tables: patient count, today’s appointments, current
  month invoice totals (and PATIENT self-scope upcoming-visit / open-balance cards)
- Role-filter metrics the same way `filterMetricsForRole` does on the frontend mock
- OpenAPI path + RDO; HTTP tests; authorization-matrix row
- Document the mapping in [api-endpoints.md](../../contracts/api-endpoints.md) and, if needed,
  [data-contracts.md](../../contracts/data-contracts.md) concepts only (do not duplicate OpenAPI
  schemas)

## Out of Scope

- Frontend live wiring (FE-024)
- Recharts / chart series / warehouses
- Redis / cache
- Inventing a ratings or satisfaction domain (`patient_satisfaction` stays mock-only; omit it
  from the live RDO)
- Cookie/BFF session model (M11)
- M9 AWS

## Requirements

- Authenticated session required (401 anonymous). Tenant from the session; reject client
  `practiceId` mismatch. No new catalog permission string — any authenticated member of the
  resolved tenant may read the overview; **which cards appear** follows role, matching
  `docs/mocks/dashboard.json` `roles` (NURSE does not see monthly revenue; PATIENT sees
  upcoming visits and open balance only).
- Counts and currency strings come from the database for that tenant, not hardcoded marketing
  figures.
- `synthetic: true` on the RDO if other list RDOs do that; do not leak other users’ PHI into
  card titles.
- Frontend checks remain UX only.

## Acceptance Criteria

- [x] `GET /dashboard/overview` exists in Nest and generated OpenAPI
- [x] Anonymous is 401; client `practiceId` mismatch is rejected; cross-tenant data does not
  appear
- [x] Practice-admin response includes patient count and today’s appointment count that match
  seeded rows after DATA-002
- [x] PATIENT response omits practice revenue/patient-census cards and includes self-scope
  upcoming visits / open balance derived from that patient’s rows
- [x] Live payload does not include `patient_satisfaction` or fake “2,834” census
- [x] HTTP tests plus a matrix row cover this GET (extend the matrix file; do not reopen QA-004)

## Dependencies

- BE-009 (session/guards), DATA-002 (credible seed)
- Follows: BE-003, BE-004, BE-007 tables (already shipped)
- Blocks: FE-024

## Validation

- `npm run test:api` (HTTP spec + matrix + OpenAPI generate)
- Spot-check seeded practice admin vs PATIENT accounts

## Risks / Considerations

- “Today” must use a documented timezone rule (UTC date of `now` is acceptable if tests freeze
  time).
- Do not join PHI into metric labels.

## Implementation notes

Suggested order: after DATA-002, before FE-024. Follow BE-010 module patterns (guard,
permissions if a catalog string is truly required — prefer none). Do not implement the Next BFF.

Writing this spec is not a version bump.

## Completion

- Implementation: Nest `GET /dashboard/overview` (`DashboardModule`) aggregates session-tenant
  patient count, UTC-today appointments (excluding cancelled), and current-UTC-month invoice
  totals. Role filter matches `docs/mocks/dashboard.json` without `patient_satisfaction`. PATIENT
  cards use `patients.portalUserId`. No new permission string. Leftover Next BFF is unchanged
  (FE-024). Harbor extra-appointment re-seed parks slots before refresh so day rollover does not
  violate the provider exclusion constraint.
- Tests: `apps/api/src/dashboard/dashboard.access.spec.ts`;
  `apps/api/test/dashboard.http.spec.ts` (401/403/roles/tenant/Harbor);
  authorization-matrix `GET /dashboard/overview` → 200. `npm run test:api`.
- PR:
- Notes: Version 0.60.0 → 0.61.0 (MINOR, new public API). `analytics.overview-api` shipped;
  dashboard cards stay mock until FE-024.
