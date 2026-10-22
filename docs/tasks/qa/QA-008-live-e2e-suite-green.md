---
id: QA-008
type: task
area: qa
feature: testing
status: implemented
priority: medium
estimate: 3
dependencies: [DATA-006, FE-043, FE-045, FE-046, FE-047]
related_adrs: [ADR-005-synthetic-demo-data.md]
related_docs:
  [
    ../backend/DATA-006-live-seed-for-list-paging.md,
    ../frontend/FE-043-administration-paginated-lists.md,
    ../frontend/FE-045-billing-bounded-invoice-and-claims-lists.md,
    ../frontend/FE-046-admin-event-filter-options-parity.md,
    ../frontend/FE-047-audit-event-time-column-no-wrap.md,
    QA-006-live-demo-smoke.md,
  ]
implementation:
  status: complete
validation:
  responsive: false
  accessibility: false
  tests_required: true
plane:
  work_item_id: c0ba7301-96a0-43d5-b950-21055c80a9f4
  identifier: MEDCONNECT-129
---

# QA-008 — Live e2e suite green

## Objective

`npm run e2e:live` passes end to end on a freshly seeded local Compose stack.

## Context

The live suite last ran during M19 (DATA-006) and failed 12 of 14 specs. The suite and the API
limiter disagree: the `auth.login.account` policy allows 5 sign-ins per account per 15 minutes
(`apps/api/src/rate-limit/rate-limit.policies.ts`), and the suite signs in as the practice admin in
about a dozen specs. That produces "Too many attempts" and then the "Multiple Sessions Detected"
dialog, which blocks later clicks. Some specs are also stale after paging (FE-043, FE-045):

- `administration-live.spec.ts:13` looks for a list named "Practice users"; the UI renders a table
  (`apps/web/src/components/admin/user-role-list.tsx`).
- `billing-live.spec.ts:54` expects Avery Quinn's $80 invoice on page 1. Throwaway $41 invoices
  created by earlier `billing-live` runs accumulate on the same database and fill page 1.
- `auth-mfa-live.spec.ts:5` hits a strict-mode `Email` label with 5 matches.

Other failures (appointment, telehealth, patient, notifications, dashboard, clinical, oauth) were
not diagnosed; some may be the same sign-in pile-up. Details are in the DATA-006 Completion notes.

## Scope

- Diagnose each failing spec, starting from a run where limiter and session state is reset
  between specs.
- Fix the suite's sign-in handling so one run does not trip the account limit or the
  concurrent-session dialog. Prefer reusing a signed-in session or per-spec cleanup in the e2e
  helpers. Do not change API limits.
- Update stale locators and page-1 assumptions in the live specs.
- Make the live specs safe to re-run on the same database: rows the specs create must not break
  later runs.
- Document the run steps (seed, API, state reset) in `docs/workflows/` where live e2e is already
  described.

## Out of Scope

- Changing rate limits, session limits or seed data
- New product features or UI changes, except test hooks needed for stable locators
- The mock-mode suite (`e2e:mocks`)
- Running the live suite against Render

## Requirements

- Synthetic data only; no production limit is relaxed for tests.
- Specs assert behaviour, not seeded counts that change with paging.
- Each fix says why, in the spec or the Completion notes.
- Keep `auth-live`, `auth-mfa-live` and `auth-oauth-live` as real sign-ins.
- Cleanup of test data stays scoped to rows the specs created.

## Acceptance Criteria

- [x] On a freshly seeded local database, `npm run e2e:live` passes with no failures and no retries
- [x] A second consecutive `e2e:live` run on the same database also passes
- [x] No API rate-limit or session-limit setting is changed
- [x] The Practice users, invoice and MFA specs no longer depend on stale locators or page-1
      contents
- [x] The run procedure is written down, including how to reset limiter and session state
- [x] `lint:web` and `type-check:web` pass, and `e2e:mocks` is unaffected

## Dependencies

- Blocked by: DATA-006, FE-043, FE-045
- Sequenced after: FE-046, FE-047 (same admin specs)
- Related: QA-005, QA-006, QA-007

## Validation

`npm run e2e:live` twice in a row on Compose, then `npm run lint:web`, `npm run type-check:web` and
`npm run e2e:mocks`. Delegate long runs to the `test-runner` subagent.

## Risks / considerations

- Reusing sessions can hide real sign-in bugs; keep the dedicated auth specs on real sign-in.
- Cleaning test data on a shared database must stay scoped to rows the specs created.
- A failure not explained by sign-in pile-up or stale locators may be a real product bug; split it
  into its own task rather than hiding it.

## Implementation notes

No version bump is expected for test-only changes (documentation and test changes do not ship a
product change); bump PATCH only if a test hook or product file changes.

## Completion

- Implementation: live config now has four Playwright projects. `auth` runs the real sign-in specs
  (`auth-live`, `auth-mfa-live`, `auth-oauth-live`), `setup` signs in once as the practice admin and
  once as the live provider and saves `e2e/.auth/*.json` (gitignored), `app` reuses them through
  `storageState`, `teardown` signs both out. New: `e2e/live.setup.ts`, `live.teardown.ts`,
  `helpers/live-session.ts` (shared `mutationHeaders`, `openDashboard`). A run makes 2 admin password
  sign-ins against the limit of 5 per 15 minutes; no limit or session setting changed.
- Why each fix: the app specs no longer sign in themselves (that was the "Too many attempts" and
  "Multiple Sessions Detected" pile-up). `auth-live` is matched by `auth{,-*}-live.spec.ts`; the first glob
  missed it and it ran on top of a shared session. Administration: users, audit and security events are
  tables (FE-043), and 28 users exceed one page, so the spec narrows with `usersQ`, `auditAction`,
  `securityAction`. Billing: asserts the Overdue row with `invoicesStatus=overdue` and the $80 Paid row with
  `invoicesStatus=paid&invoicesSort=issued-asc`, so $41 invoices from earlier runs cannot push them off
  page 1. Patients and clinical use `patientsQ` search. MFA: `getByLabel` with `exact: true`
  (5 matches). Notifications: `getByText('Read', {exact: true})` (matched body text).
  Appointments: `.first()` on the seeded visit button (two matches in the week).
- Rerun safety: run `npm run seed:mock-identity` before every run; it resets the seeded telehealth
  visit that the telehealth spec ends. Rows the specs create (paid $41 invoices, Quinn Harlow patients,
  appointments) are left and no spec depends on them. Procedure and the limiter/session reset SQL are
  in `docs/workflows/frontend-testing.md`.
- Tests: `npm run e2e:live` twice in a row (reset, seed, run; seed, run): 18 passed each (31 s), no
  retries. `lint:web` 0 errors (9 existing warnings), `type-check:web` pass, `e2e:mocks` 35 passed.
- PR:
- Notes: no version bump (test and docs only). Not verified: a third run inside 15 minutes (documented
  to hit the account limit), Render. Security review not run: no auth, tenant or audit code changed.
