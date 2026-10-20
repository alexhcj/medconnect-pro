---
id: FE-043
type: task
area: frontend
feature: administration
status: pending
priority: high
estimate: 3
dependencies: [FE-009, FE-016, FE-029, BE-025]
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
  file_url: ""
  frame: ""
  status: not_started
implementation:
  status: not_started
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
- Users list pagination and search depend on BE-025; audit and security work does not.

## Acceptance Criteria

- [ ] Initial load of each viewer fetches exactly one page
- [ ] Next/previous and page controls load the right page and keep filters
- [ ] Filter change resets to page 1 and updates the range label
- [ ] Empty, loading and error states render for each list
- [ ] Users list shows paginated results with search and role filter
- [ ] Layout works at 320 px without horizontal scroll
- [ ] Hook and viewer tests cover paging and filter reset

## Dependencies

- Blocked by: FE-009, FE-016, FE-029; users list also BE-025
- Design: Figma file https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd (frame to be set; status `not_started`)
- Related: FE-044, FE-045

## Validation

`npm run lint:web`, `type-check:web`, `test:web`; browser check with a seeded multi-page audit set.

## Risks / considerations

- Audit and security views may need seed volume to demonstrate paging.
- Filter inputs must not allow client-supplied tenant scope.

## Implementation notes

MINOR bump while `0.x` (changed public UI behaviour), PATCH if only internal.
