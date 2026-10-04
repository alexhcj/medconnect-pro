---
id: FE-024
type: task
area: frontend
feature: dashboard
status: pending
priority: high
estimate: 2
dependencies: [FE-001, BE-011, BE-009]
related_adrs: [ADR-003-authentication.md]
related_docs:
  [
    ../../architecture/frontend-architecture.md,
    ../../contracts/api-endpoints.md,
    ../../product/analytics.md,
    FE-001-dashboard-shell.md,
    ../backend/BE-011-dashboard-overview-api.md,
  ]
design:
  required: false
  tool: figma
  file_url: ""
  frame: ""
  status: not_required
implementation:
  status: not_started
validation:
  responsive: true
  accessibility: true
  tests_required: true
plane:
  work_item_id: 49a1f7ee-7a90-4338-a93b-a2f49c6e4a06
  identifier: MEDCONNECT-75
---

# FE-024 — Live dashboard overview

## Objective

Point live dashboard overview at Nest `GET /dashboard/overview` with the same Bearer session
client as other live domains, and delete the leftover cookie BFF.

## Context

[`dashboard-api.ts`](../../../apps/web/src/lib/api/dashboard-api.ts) in real mode calls
`/api/dashboard/overview` (Next.js). That route reads an `accessToken` cookie Nest never sets.
Other live APIs use `apiFetch` against `NEXT_PUBLIC_API_BASE_URL` with the BE-009 bearer.

The dashboard page and `StatsCards` already render `DashboardOverview.metrics`. Reuse them.

Implements / extends `analytics.mock-overview-cards` (live path) and `analytics.overview-api`.

## Scope

- Live `dashboardRealAPI.getOverview` → Nest `GET /dashboard/overview` with Bearer; unwrap RDO
  onto existing `DashboardOverview` types
- Delete `apps/web/src/app/api/dashboard/overview/route.ts`
- Keep mock fixtures and `filterMetricsForRole` for `NEXT_PUBLIC_USE_MOCKS=true`
- One `e2e:live` check: practice admin sees non-empty honest cards after seed
- Update capability matrix / `docs/product/analytics.md` when the live path ships (statused
  catalog + public-claim ceiling together)

## Out of Scope

- New Recharts dashboard, extra chart widgets, alert banners
- HttpOnly cookie cutover (M11)
- Notifications Bell (FE-025)
- Redesign of StatsCards (no new Figma; `design.status: not_required`)
- Changing mock fixture marketing numbers (mocks may stay as-is)

## Requirements

- No client `practiceId` for authorization
- Loading / error / retry already on `/dashboard`; keep them
- Do not treat frontend role filters as authorization

## Acceptance Criteria

- [ ] With mocks off, `/dashboard` loads metrics from Nest using the BE-009 session; no call to
  `/api/dashboard/overview`
- [ ] The leftover Next BFF route file is gone
- [ ] Mock mode still renders fixture cards
- [ ] One non-mock browser check shows at least patient-count and today’s-appointment cards for
  `practice.admin@example.test` after DATA-002 seed
- [ ] `docs/product/analytics.md` and the capability-matrix analytics row match the shipped live
  API (still no HIPAA / live-video / payments claims)

## Dependencies

- FE-001 (shell + cards), BE-011, BE-009
- DATA-002 via BE-011 (seed must exist for the live e2e)
- Design: not required (reuse FE-001 `StatsCards`)

Figma file (shared library, not a blocker):
https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd

## Validation

- Vitest for live client mapping (Bearer, Nest path)
- `npm run e2e:live` new or extended dashboard spec; mock Playwright stays on mocks
- Manual `dev:real` `/dashboard`

## Risks / Considerations

- Live metric IDs must map onto existing `DashboardMetric` (`users` | `calendar` | `revenue` |
  `satisfaction`). If live omits satisfaction, the UI must not break.

## Implementation notes

Suggested order: after BE-011. Follow `admin-api.ts` / `medical-api.ts` live client patterns.

Writing this spec is not a version bump.

## Completion

- Implementation:
- Tests:
- PR:
- Notes: Pending M10 implementation.
