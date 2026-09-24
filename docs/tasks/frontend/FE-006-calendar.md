---
id: FE-006
type: task
area: frontend
feature: scheduling
status: implemented
priority: high
estimate: 3
dependencies: [FE-005]
related_adrs: []
related_docs: [frontend-architecture.md,../01-product-requirements.md]
plane:
  work_item_id: 4e8cc0ab-c90c-4303-8337-7a1c08852146
  identifier: MEDCONNECT-25
---

# FE-006 — Calendar

## Objective

Implement calendar views and appointment interaction.

## Scope

Use React Big Calendar with healthcare-oriented responsive behavior.

## Technical constraints

- Follow the project architecture.
- Preserve tenant and authorization boundaries.
- Use synthetic demo data only.
- Follow accessibility and responsive requirements.
- Do not introduce unnecessary dependencies.

## Acceptance criteria

- [x] Calendar renders
- [x] Day/week/month views work as applicable
- [x] Appointment selection works
- [x] Tablet layout works
- [x] Loading/error states exist

## Implementation notes

Keep calendar state distinct from server state.

## Completion

- Implementation: Calendar/list toggle on `/dashboard/appointments` (calendar default). React Big Calendar month/week/day with local view/date/selection state; appointments stay in TanStack Query. Selection opens an accessible details dialog. Mock-only until BE-004. Visible date initializes from loaded appointments so October fixtures appear.
- Tests: Vitest for event mapping, toolbar views, loading/error/empty/mock-only, selection dialog, and page toggle. Playwright tablet flow for day/week/month switching, event selection, and list fallback. FE-005 create E2E now opens List after redirect.
- PR:
- Notes: Mock list still returns the full in-memory practice set (same as FE-005). Drag/drop, slot-click create, and Nest `/appointments` stay out of scope. QA-003 remains a later task.
