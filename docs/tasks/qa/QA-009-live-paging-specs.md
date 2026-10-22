---
id: QA-009
type: task
area: qa
feature: testing
status: implemented
priority: low
estimate: 2
dependencies: [DATA-006, QA-008]
related_adrs: [ADR-005-synthetic-demo-data.md]
related_docs:
  [
    ../backend/DATA-006-live-seed-for-list-paging.md,
    ../frontend/FE-043-administration-paginated-lists.md,
    ../frontend/FE-044-patient-list-bounded-height.md,
    ../frontend/FE-045-billing-bounded-invoice-and-claims-lists.md,
    QA-008-live-e2e-suite-green.md,
  ]
implementation:
  status: complete
validation:
  responsive: false
  accessibility: false
  tests_required: true
plane:
  work_item_id: 0261a4a8-54a8-4b72-8b15-885793d62705
  identifier: MEDCONNECT-130
---

# QA-009 — Live paging specs

## Objective

`npm run e2e:live` proves, in a browser against the Nest API, that every M19 list reaches a second
page: patients, invoices, claims, audit events, security events and practice users.

## Context

M19 bounded the lists (FE-043, FE-044, FE-045) and DATA-006 seeded more than one page of each on the
live stack. QA-008 made the live suite green, but no live spec clicks past page 1. The admin and
billing live specs narrow with filters (`administration-live.spec.ts`, `billing-live.spec.ts`) and
`patient-live.spec.ts` only searches with `patientsQ`. Page 2 is shown today only by API totals
recorded in DATA-006 Completion, so a regression in the live paging join (page param, `total`
mapping, Next/Previous state) would pass the suite.

## Scope

- One live spec per list that opens the list with the real session, goes to page 2 with the Next
  control, and asserts the page indicator, a non-empty row set and the URL `page=2` state; then
  returns with Previous.
  - Patients: `SimplePagination` (Previous/Next, "Page N", no total).
  - Invoices, claims, audit events, security events, practice users: `Pagination` ("Page N of M").
- Reuse the `app` project `storageState` and helpers from QA-008 (`helpers/live-session.ts`).
- Add the new specs to the run procedure in `docs/workflows/frontend-testing.md` only if the steps
  change.

## Out of Scope

- Changing page sizes, seed data, rate limits or session limits
- Sorting, `total` on patients or appointments, or any API or UI change
- Asserting exact seeded row counts or specific rows on page 2 (rows created by earlier runs shift
  paging)
- The mock-mode suite (`e2e:mocks`) and running against Render

## Requirements

- Synthetic data only.
- Assert behaviour that holds as runs add rows: page 2 exists and is non-empty, the indicator reads
  page 2, Previous returns to page 1. Do not assert seeded counts.
- No new sign-ins in the `app` project; keep the account limit at 2 admin password sign-ins per run.
- A failure not explained by the spec is a possible product bug: split it into its own task rather
  than weakening the assertion.

## Acceptance Criteria

- [x] A live spec reaches page 2 and back for patients, invoices, claims, audit events, security
      events and practice users
- [x] Each spec asserts the page indicator and URL `page` state, not seeded counts
- [x] `npm run e2e:live` passes on a freshly seeded database and again on a second consecutive run
- [x] No rate-limit, session-limit, page-size or seed setting is changed
- [x] `lint:web` and `type-check:web` pass, and `e2e:mocks` is unaffected

## Dependencies

- Blocked by: DATA-006, QA-008
- Related: FE-043, FE-044, FE-045, QA-006

## Validation

Reset limiter and session state and run `npm run seed:mock-identity`, then `npm run e2e:live`
twice in a row on Compose per `docs/workflows/frontend-testing.md`; then `npm run lint:web`,
`npm run type-check:web` and `npm run e2e:mocks`. Delegate long runs to the `test-runner` subagent.

## Risks / considerations

- A third live run inside 15 minutes hits the account limit (QA-008); do not add sign-ins to work
  around it.
- Patients page at 10 rows with 18 extra seeded patients, so page 2 exists; users need more than 25
  memberships (28 seeded). If a future seed change drops below one page the spec should fail loudly
  rather than skip.

## Implementation notes

No version bump is expected for test-only changes; bump PATCH only if a test hook or product file
changes.

## Completion

- Implementation: new `apps/web/e2e/list-paging-live.spec.ts` (6 tests, `app` project, saved admin
  session, 390 px viewport so the text indicators "Page N of M" and "· Page N" show). Each test checks
  Previous is disabled and Next enabled on page 1, clicks Next, asserts the `<prefix>Page=2` URL key
  (`patientsPage`, `invoicesPage`, `claimsPage`, `auditPage`, `securityPage`, `usersPage`; the spec's
  unprefixed `page=2` wording meant these), the page-2 indicator and a visible row, then clicks Previous
  and asserts the param is gone and page 1 shows. No exact counts, no sign-ins, no writes. A list that
  drops below one page fails at the Next-enabled check.
- Tests: `npm run e2e:live` twice (reset, seed, run; seed, run): 24 passed each, no retries.
  `lint:web` 0 errors (9 existing warnings), `type-check:web` pass, `e2e:mocks` 35 passed.
- PR:
- Notes: no version bump (test and docs only); `frontend-testing.md` unchanged (run steps same). No
  rate-limit, session, page-size or seed setting changed. Security review not run: no auth, tenant or
  audit code changed.
