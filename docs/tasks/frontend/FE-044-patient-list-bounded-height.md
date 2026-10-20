---
id: FE-044
type: task
area: frontend
feature: patient-management
status: pending
priority: medium
estimate: 2
dependencies: [FE-002, FE-011]
related_adrs: [ADR-011-figma-canonical-visual-source.md]
related_docs:
  [
    ../../architecture/frontend-architecture.md,
    ../../product/patient-management.md,
    ../../workflows/design-requirements.md,
    FE-002-patient-list.md,
    FE-011-patient-ui-nest-api.md,
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
  work_item_id: 909672bd-a359-4d73-b941-5ebfeb94d5cc
  identifier: MEDCONNECT-122
---

# FE-044 — Patient list bounded height

## Objective

Constrain the patients list height so it does not grow with the number of patients, while keeping
the existing search, status and sort controls.

## Context

The patients list has filters but no height limit; it appends pages with `nextPage`
(`components/patients/patient-list.tsx`, `usePatientSearch`). The API already supports `q`,
`status`, `sort` and `page`.

## Scope

- Recommended: replace unbounded append with fixed-size pages and previous/next (or numbered)
  controls, so rendered height is bounded by page size.
- Alternative to evaluate in design: fixed max-height scroll area with "Load more".
- Keep the page in the URL query so refresh and back/forward keep position.

## Out of Scope

- API changes (already paged)
- New filters or columns
- Patient create/edit flows

## Requirements

- Changing search, status or sort resets to page 1.
- Show range and total when the API provides it; otherwise next/previous only.
- Controls keyboard accessible with 44 px targets.
- Existing empty, loading and error states preserved.

## Acceptance Criteria

- [ ] At most one page of rows is rendered at a time
- [ ] Filter, search or sort change resets to page 1
- [ ] Page position survives refresh and back/forward through the URL
- [ ] Works at 320 px without horizontal scroll
- [ ] Patient list tests updated and passing

## Dependencies

- Blocked by: FE-002, FE-011
- Design: Figma file https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd (frame to be set; status `not_started`)
- Related: FE-043, FE-045

## Validation

`npm run lint:web`, `type-check:web`, `test:web`; browser check with the seeded patient set.

## Risks / considerations

- The page-vs-"Load more" choice needs human approval in design.
- If the API has no `total`, range labels are limited.

## Implementation notes

PATCH or MINOR per whether the interaction model counts as a new UI surface.
