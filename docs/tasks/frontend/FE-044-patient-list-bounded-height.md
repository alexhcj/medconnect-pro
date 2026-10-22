---
id: FE-044
type: task
area: frontend
feature: patient-management
status: implemented
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
  file_url: "https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd?node-id=252-22"
  frame: "FE-044 Patient list paging: Desktop 1280 page 1 (252:3174) and last page (252:3289); Mobile 320 page 2 (252:3356), loading (252:3470), empty (252:3507), error (252:3534); Tablet 768 page 1 (252:3564); components Patient row (252:39), Patient pager (252:85)"
  status: approved
implementation:
  status: complete
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

- [x] At most one page of rows is rendered at a time
- [x] Filter, search or sort change resets to page 1
- [x] Page position survives refresh and back/forward through the URL
- [x] Works at 320 px without horizontal scroll
- [x] Patient list tests updated and passing

## Dependencies

- Blocked by: FE-002, FE-011
- Design: Figma file https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd?node-id=252-22 (page "FE-044 Patient list paging", frames above; status `approved`). Approved decisions: previous/next pager with "Showing X–Y" and "Page N" (no total, no numbered pages), 10 rows per page, no scroll area or "Load more", pager in page flow
- Related: FE-043, FE-045

## Validation

`npm run lint:web`, `type-check:web`, `test:web`; browser check with the seeded patient set.

## Risks / considerations

- The page-vs-"Load more" choice needs human approval in design.
- If the API has no `total`, range labels are limited.

## Implementation notes

PATCH or MINOR per whether the interaction model counts as a new UI surface.

## Completion

- Shipped at 0.95.0. The patients list renders one page of 10 rows with Previous/Next, "Showing X–Y" and "Page N" (no total: the API returns only `hasMore`). Page, search, status and sort live in `patientsPage`, `patientsQ`, `patientsStatus`, `patientsSort`; a filter change drops the page. New: `SimplePagination`, `usePatientPage`, `lib/patients/list-params.ts`. `usePatientSearch` is unchanged for the appointment picker.
- Tests: `patient-list`, `simple-pagination`, `list-params`, `use-list-url-state`; e2e `patients-list.spec.ts` (10 rows, paging, URL after reload, back, filter reset, 320 px no horizontal scroll). `lint:web` 0 errors, `type-check:web` clean, `test:web` 512 passed. `e2e:mocks`: 27 of 28 in the full run; the one failure, `billing-dashboard.spec.ts:88`, is unrelated and passed when run alone (4 of 4), so it looks timing-sensitive under parallel load.
- An e2e run found a race: two quick select changes could overwrite each other while the URL was still updating. Fixed by remembering the last written status and sort.
- Not verified: keyboard-only use and a 320 px screenshot in a real browser (covered by unit tests and the e2e overflow check), and the live API path (`e2e:live`). Security review not run: no auth, tenant or audit change.
- Notes: version 0.94.0 → 0.95.0 (MINOR: new interaction model and URL state). `docs/product/` and the capability matrix are unchanged (no new capability claim). Design: Figma page "FE-044 Patient list paging".
