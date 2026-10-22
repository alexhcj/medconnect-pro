---
id: QA-008
type: task
area: qa
feature: testing
status: pending
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
  status: not_started
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

- [ ] On a freshly seeded local database, `npm run e2e:live` passes with no failures and no retries
- [ ] A second consecutive `e2e:live` run on the same database also passes
- [ ] No API rate-limit or session-limit setting is changed
- [ ] The Practice users, invoice and MFA specs no longer depend on stale locators or page-1
      contents
- [ ] The run procedure is written down, including how to reset limiter and session state
- [ ] `lint:web` and `type-check:web` pass, and `e2e:mocks` is unaffected

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

- Implementation:
- Tests:
- PR:
- Notes:
