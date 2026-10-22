---
id: DATA-006
type: task
area: backend
feature: demo-data
status: complete
priority: medium
estimate: 3
dependencies: [DATA-002, DATA-005, BE-025, BE-026, FE-043, FE-045]
related_adrs: [ADR-005-synthetic-demo-data.md, ADR-002-tenant-isolation.md]
related_docs:
  [
    ../../architecture/data-architecture.md,
    ../../contracts/api-endpoints.md,
    ../../product/administration.md,
    ../../product/billing.md,
    DATA-002-bounded-synthetic-seed.md,
    BE-025-billing-and-user-list-pagination-contract.md,
    BE-026-audit-and-security-event-list-total.md,
    ../frontend/FE-043-administration-paginated-lists.md,
    ../frontend/FE-045-billing-bounded-invoice-and-claims-lists.md,
  ]
implementation:
  status: complete
validation:
  responsive: false
  accessibility: false
  tests_required: true
plane:
  work_item_id: 1ba22c65-68e2-4fe4-90bb-c817be76b952
  identifier: MEDCONNECT-125
---

# DATA-006 — Live seed volume for list paging

## Objective

Make the paged admin and billing lists demonstrable on the live stack (local Compose and the Render
demo) by seeding enough synthetic rows for a second page.

## Context

M19 shipped paging for audit events, security events, users (page size 25), and invoices and claims
(page size 10). The web mock adapter holds enough rows to page (about 66 audit events, 44 security
events, 46 users, 35 invoices), but the live seed in `apps/api/src/identity/seed-mock-identity*.ts`
holds 0 audit events, 0 security events, 4 users plus one local OIDC user, and 6 invoices (so 6
claims). On the live stack every list fits on one page. The M19 audit and FE-045's "Not verified"
note recorded this gap. Patients already page (18 extra seeded patients, page size 10).

## Scope

- Extend the bounded synthetic seed so each of these lists has more than one page for the Harbor
  practice: audit events, security events, practice users, invoices, claims (derived from invoices).
- Keep seeded users scoped to the demo practice and clearly synthetic (`synthetic.example` style).
- Keep seeding idempotent and bounded (small fixed corpus, stable ids), following DATA-002 and the
  existing `seed-mock-identity-corpus.ts` pattern.
- Verification step: run `npm run e2e:live` (or the local live-stack equivalent) for admin, patients
  and billing paging, and the full `npm run test:api`, which M19 did not run.

## Out of Scope

- Schema or migration changes
- New API routes, query params or DTO fields (BE-025, BE-026)
- Web UI changes (FE-043, FE-045) and mock adapter volume
- New demo sign-in accounts, passwords or permissions (DATA-005)
- Sorting for audit and security-event lists
- Fixing the existing `telehealth-session.service.spec.ts:398` type error unless the seed change
  touches it

## Requirements

- Synthetic data only; no real PHI, no real emails.
- Re-running the seed must not duplicate users, memberships, invoices, payments or events, and must
  not change existing seeded rows or the logins in `docs/mocks/demo-users.json`.
- Seeded audit and security events use action names the API actually writes (see FE-046 for the
  current list), tenant-scoped to the demo practice, with plausible spread of timestamps.
- Seeded extra users get roles that do not grant new sign-in paths (no usable demo passwords).
- Seeded invoices keep patient ownership so the PATIENT account still sees only its own rows.
- Total volume stays bounded; boot and test time must not grow noticeably.

## Acceptance Criteria

- [x] On a freshly seeded live database the Harbor admin sees at least two pages of audit events,
      security events, users, invoices, and claims at the default page sizes
- [x] Re-running the seed leaves row counts unchanged for each seeded table
- [x] The PATIENT demo account still sees only its own invoices and claims, and its own count is
      unchanged or documented
- [x] Existing seed, billing, audit and practice-user tests pass; any test that asserted the old
      counts is updated and says why
- [x] No seeded value appears in the OpenAPI document or `docs/mocks/demo-users.json` logins other
      than documented additions
- [ ] `e2e:live` and full `test:api` were run once and their results (including pre-existing
      failures) recorded in Completion

## Dependencies

- Blocked by: DATA-002, DATA-005, BE-025, BE-026, FE-043, FE-045
- Related: FE-046, FE-047, QA-006

## Validation

`npm run test:api` (seed and HTTP specs), `npm run type-check:api`, `npm run lint:api`; run the live
stack and open `/dashboard/admin` and `/dashboard/billing` to confirm a second page exists.
Delegate long runs to the `test-runner` subagent.

## Risks / considerations

- The live-demo smoke test (QA-006) and the interview presentation pack may assert seeded counts or
  names; check them before changing volumes.
- Counts in billing totals or dashboard cards that sum seeded invoices may change; compare the
  Overview API and dashboard tests.
- A larger audit corpus competes with events created at runtime; seed rows must not break "newest
  first" expectations in tests.

## Implementation notes

Bump is PATCH while `0.x` (seed content only, no contract change) unless a public claim changes.
Update the release-roadmap M19 entry and master task list.

## Completion

- Implementation: `seed-mock-identity-corpus.ts` adds 24 NURSE/RECEPTIONIST staff users
  (`@synthetic.example`, no mock IdP login), 8 invoices older than Avery Quinn's Aug 10 invoice on
  other patients, and 45 audit events (30 `auth.*`, stable ids, `seed-audit-NN` correlation ids,
  spread over about 21 days). `seed-mock-identity.ts` seeds them find-or-create; audit rows are
  inserted only when their id is missing. No schema, route, DTO, web or login change.
- Tests: `seed-mock-identity-corpus.spec.ts` (corpus shape), `test/seed-mock-identity.spec.ts`
  (new counts, unchanged on a second run, PATIENT sees only Avery's invoices and claims).
  `npm run lint:api` pass. `npm run type-check:api` only the existing error at
  `telehealth-session.service.spec.ts:398`. Full `npm run test:api`: 73 files, 616 tests, all pass.
- Live check: after two `seed:mock-identity` runs on Compose, Harbor held identical counts (28
  memberships, 18 invoices and line items; audit events accumulate with sign-ins). Admin API totals
  with a second page (`hasMore` true): users 28, audit events 260, security events 199, invoices 19,
  claims 19.
- `e2e:live`: NOT green, so its criterion stays unticked. Full run (twice): 2 passed, 12 failed,
  mostly "Too many attempts" at login and the "Multiple Sessions Detected" dialog from repeated
  sign-ins in one suite. Isolated runs: `administration-live.spec.ts:45` passes. `:13` fails because
  it looks for a list named "Practice users" but `user-role-list.tsx:149` renders a table (spec
  predates FE-043; not caused by the seed). `billing-live.spec.ts:54` fails at `$80.00` because six
  $41 invoices left by earlier `billing-live` runs on this dev database fill page 1; on a fresh
  seed the $80 invoice is 6th. `auth-mfa-live.spec.ts:5` fails on a strict-mode `Email` label
  (5 matches). These specs need their own fix (web, out of scope here) or a fresh database run.
- PR:
- Notes: Version 0.96.0 -> 0.96.1 (PATCH, seed content only). Seeded staff can sign in only through
  the local fake OIDC (`APP_ENV=local`), as every seeded user already can. Render needs an operator
  `SEED_ON_DEPLOY=true` deploy to pick the rows up; not done.
