---
id: FE-001
type: task
area: frontend
feature: dashboard
status: implemented
priority: high
estimate: 2
dependencies: []
related_adrs: []
related_docs: [frontend-architecture.md,../01-product-requirements.md,../contracts/api-endpoints.md]
plane:
  work_item_id: null
  identifier: null
---

# FE-001 — Dashboard shell

## Objective

Create the authenticated dashboard shell and reusable layout.

## Scope

Navigation, role-aware menu presentation, responsive shell and loading/error boundaries.

## Technical constraints

- Follow the project architecture.
- Preserve tenant and authorization boundaries.
- Use synthetic demo data only.
- Follow accessibility and responsive requirements.
- Do not introduce unnecessary dependencies.

## Acceptance criteria

- [x] Dashboard route exists
- [x] Responsive shell exists
- [x] Navigation is accessible
- [x] Loading/error states exist
- [x] Synthetic dashboard data is isolated

## Implementation notes

Do not make navigation visibility the authorization mechanism.

## Completion

- Implementation: Dashboard route group layout, accessible shell, role-aware nav (UX only), isolated overview metrics, stub nav routes.
- Tests: Vitest unit tests for nav/metric filters; RTL shell accessibility and mobile-nav tests; Playwright dashboard→patients navigation.
- PR:
- Notes: Menu visibility is not authorization. Session gate and mock login are FE-010. Server
  enforcement is BE-009; SEC-001 remains the model.
