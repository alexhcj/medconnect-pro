---
id: FE-046
type: task
area: frontend
feature: administration
status: implemented
priority: low
estimate: 1
dependencies: [FE-043, BE-026]
related_adrs: []
related_docs:
  [
    ../../architecture/frontend-architecture.md,
    ../../product/administration.md,
    FE-043-administration-paginated-lists.md,
    FE-029-security-events-ui.md,
    ../backend/BE-026-audit-and-security-event-list-total.md,
  ]
design:
  required: false
  status: not_required
implementation:
  status: complete
validation:
  responsive: true
  accessibility: true
  tests_required: true
plane:
  work_item_id: cd63e3fb-90cd-4506-984c-119b20f230df
  identifier: MEDCONNECT-126
---

# FE-046 — Admin event filter options parity

## Objective

The Action filter dropdowns on the audit and security event lists offer exactly the actions the API
writes, so an admin can filter to any real event from the UI.

## Context

`apps/web/src/lib/admin/event-filter-options.ts` drifted from the API during M19. It lists
`invoice.viewed`, which only the web mocks produce. The security-events list lacks four auth
actions the API writes (`auth.mfa.failed`, `auth.logout_all`, `auth.refresh.reuse`,
`auth.session.revoked`), and the audit list lacks two telehealth media actions written in
`apps/api/src/telehealth/telehealth-session.service.ts` (lines 163 and 269 at audit time). Those
actions can only be filtered by typing the URL.

## Scope

- Reconcile the audit and security-event Action options with the actions the API writes, taken from
  the API source (and `docs/contracts/` if it lists them).
- Remove options no API path writes, or keep them only if the mock-only reason is documented.
- Add a test that fails when the option list and the known API action set disagree.
- Keep the mock adapter producing events from the same action set.

## Out of Scope

- New audit actions or API changes (BE-026 and earlier)
- Free-text action search, multi-select filters, or new filter fields
- Sorting, export or retention
- List layout or paging (FE-043) and time column width (FE-047)

## Requirements

- Option labels follow the existing label style in `event-filter-options.ts`.
- Selecting any option filters through the existing `action` query param and URL state.
- No change to keyboard behaviour or control sizes (44 px) of the filter fields.

## Acceptance Criteria

- [x] Every action the API writes to the audit log appears in the audit Action filter
- [x] Every `auth.*` action the API writes appears in the security-events Action filter
- [x] No option exists that no API path or mock writes, or each such option is documented as mock-only
- [x] A unit test guards the option lists against drift from a single declared action set
- [x] Existing filter, URL-state and e2e tests still pass

## Dependencies

- Blocked by: FE-043, BE-026
- Related: FE-029, FE-047, DATA-006

## Validation

`npm run lint:web`, `type-check:web`, `test:web` (the admin component and filter tests); `e2e:mocks`
admin spec if filter options are asserted.

## Risks / considerations

- Without a shared source, the list drifts again. Prefer one declared action constant on the web
  side with a comment naming the API files it mirrors; do not import API code into the web app.
- DATA-006 seeds events using these action names; keep the two tasks consistent.

## Implementation notes

PATCH while `0.x` (no new capability or contract).

## Completion

- Implementation: `API_AUDIT_ACTIONS` (41 actions) in `apps/web/src/lib/admin/event-filter-options.ts`;
  both option lists derive from it; `admin-mock.ts` generators typed against it, `invoice.viewed` removed.
  Shipped at 0.96.2.
- Tests: `event-filter-options.test.ts` (new); `test:web` admin/mocks/components 153 passed;
  `e2e:mocks` `administration.spec.ts` 4 passed; type-check and lint clean (pre-existing warnings only).
- PR:
- Notes: the Context section listed 6 missing actions; the API writes 19 that were not offered,
  all added. Resource-type options also lack `condition`, `medication`, `external_identity`
  (out of scope, possible follow-up). The test does not scan API source (spec forbids importing API code).
