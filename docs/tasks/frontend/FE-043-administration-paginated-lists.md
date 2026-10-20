---
id: FE-043
type: task
area: frontend
feature: administration
status: complete
priority: high
estimate: 3
dependencies: [FE-009, FE-016, FE-029, BE-025, BE-026]
related_adrs: [ADR-011-figma-canonical-visual-source.md]
related_docs:
  [
    ../../architecture/frontend-architecture.md,
    ../../product/administration.md,
    ../../workflows/design-requirements.md,
    FE-016-administration-ui-nest-api.md,
    FE-029-security-events-ui.md,
    ../backend/BE-025-billing-and-user-list-pagination-contract.md,
  ]
design:
  required: true
  tool: figma
  file_url: https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd
  frame: "App / Administration: FE-043 frames (node 243:82), components in Components: FE-043 components (node 239:5)"
  status: approved
implementation:
  status: complete
validation:
  responsive: true
  accessibility: true
  tests_required: true
plane:
  work_item_id: 03a1e158-0621-416b-b975-25a6c0324ebd
  identifier: MEDCONNECT-121
---

# FE-043 — Administration paginated lists

## Objective

Audit events, security events and practice users load one page at a time with filters, instead of
loading and rendering every record as one long list.

## Context

The audit and security-event APIs already accept `page`, `pageSize`, `action`, `resourceType` and
date filters, but `useAuditEvents()` sends no params and the viewers
(`audit-event-viewer.tsx`, `security-event-viewer.tsx`) render everything. The users list has no
paging until BE-025.

## Scope

- Pagination (default 25 per page) for audit events, security events and users.
- Filters the API already supports: action, resource type, date range; users: search and role.
- Hooks and query keys include page and filters.
- Loading, empty, error states; compact table on desktop, stacked rows on mobile.
- Sort control only where the API supports it; otherwise newest first.

## Out of Scope

- New API sort parameters for audit/security events
- Export, retention, or real-time streaming
- Role assignment changes (FE-026)

## Requirements

- One request returns one page; changing a filter resets to page 1.
- Show range and total, for example "26–50 of 312".
- Pagination controls and filters are keyboard accessible, with 44 px targets and accessible names.
- Viewer height is bounded by page size.
- Users list pagination and search depend on BE-025; the audit and security range label with total
  depends on BE-026.
- Filters, page and search live in URL query params (refresh and back/forward keep position).
- Users search runs on a Search button or Enter, not on every keystroke. Date filters use native
  date inputs.

## Acceptance Criteria

- [x] Initial load of each viewer fetches exactly one page
- [x] Next/previous and page controls load the right page and keep filters
- [x] Filter change resets to page 1 and updates the range label
- [x] Empty, loading and error states render for each list
- [x] Users list shows paginated results with search and role filter
- [x] Layout works at 320 px without horizontal scroll
- [x] Hook and viewer tests cover paging and filter reset

## Dependencies

- Blocked by: FE-009, FE-016, FE-029; users list also BE-025; audit and security totals BE-026
- Design: Figma file https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd, page "App / Administration", frames 01–14 under "FE-043 frames" (https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd?node-id=243-82); components on page "Components", "FE-043 components" (node 239:5); status `approved`
- Related: FE-044, FE-045

## Validation

`npm run lint:web`, `type-check:web`, `test:web`; browser check with a seeded multi-page audit set.

## Risks / considerations

- Audit and security views may need seed volume to demonstrate paging.
- Filter inputs must not allow client-supplied tenant scope.

## Implementation notes

MINOR bump while `0.x` (changed public UI behaviour), PATCH if only internal.

## Completion

- Decisions: numbered pagination (`total` from BE-025 for users and BE-026 for audit and security); page and filters in namespaced URL params (`auditPage`, `securityAction`, `usersQ`, …), `router.push` for page and filter changes; users search on Search button or Enter; native date inputs sent as UTC-day ISO instants; no sort UI (newest first); `pageSize=25` sent explicitly because audit and security default to 50 on the server; `Input` raised to 44 px (`h-11`) with the Figma `Input` set updated. Action and resource-type selects use a curated list (`lib/admin/event-filter-options.ts`); a URL value outside the list still shows as selected.
- Implementation: `types/admin/admin-list.ts`, `lib/admin/list-params.ts`, `lib/admin/use-list-url-state.ts`, `lib/admin/event-filter-options.ts`, `lib/api/admin-api.ts`, `admin-rdo.ts`, `mocks/admin-mock.ts` (deterministic extra rows: 66 audit, 44 security, 46 users), `lib/hooks/use-admin.ts` (params in keys, `keepPreviousData`, role change patches all cached user pages), `components/ui/pagination.tsx`, `components/admin/{paged-event-list,user-role-list,audit-event-viewer,security-event-viewer,list-filter-fields,admin-list-states}.tsx`, `app/(dashboard)/dashboard/admin/page.tsx` (Suspense), `components/ui/input.tsx`.
- Tests: `list-params`, `use-list-url-state`, `use-admin`, `pagination`, three viewer specs, page spec, `admin-api`, `admin-mock`; e2e `administration.spec.ts` (paging, URL persistence after reload, filter reset, users search, 320 px no horizontal scroll). `lint:web` 0 errors, `type-check:web` clean, `test:web` 496 passed, `e2e:mocks` 26 passed.
- Browser check (local mocks): audit page 2 shows "Showing 26–50 of 66 events", 25 rows and three page buttons; users at 320 px has zero horizontal overflow and equal-width Previous/Next. Long emails got `break-all` after that check and were not re-screenshotted.
- Security review: not run; no auth, tenant, session or audit-writing change. Filters never carry a tenant id (asserted in `list-params.test.ts` and `admin-api.test.ts`).
- Deviations: none from the approved plan. Not verified: the live API path (`e2e:live`) and keyboard-only use in a browser (covered by unit tests for roles, names and disabled states only).
- Notes: Version 0.93.0 → 0.94.0 (MINOR: new UI behaviour and URL state, `Input` height change). `docs/product/` and the capability matrix are unchanged (no new capability claim).
