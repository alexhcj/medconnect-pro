---
id: FE-047
type: task
area: frontend
feature: administration
status: pending
priority: medium
estimate: 2
dependencies: [FE-043]
related_adrs: [ADR-011-figma-canonical-visual-source.md]
related_docs:
  [
    ../../architecture/frontend-architecture.md,
    ../../product/administration.md,
    ../../workflows/design-requirements.md,
    FE-043-administration-paginated-lists.md,
    FE-042-billing-role-scoped-content-and-status-colors.md,
  ]
design:
  required: false
  status: not_required
implementation:
  status: not_started
validation:
  responsive: true
  accessibility: true
  tests_required: true
plane:
  work_item_id: c7ce8a45-d04b-4859-85dc-7b41f0555f44
  identifier: MEDCONNECT-127
---

# FE-047 — Audit and security event time column without wrapping

## Objective

Timestamps in the audit and security event tables stay on one line whenever the table has room, and
`test:web` stops timing out in `patient-form.test.tsx` under the full run.

## Context

In `/dashboard/admin`, the Time column is a fixed `md:w-48` (192 px) in an auto-layout table
(`apps/web/src/components/admin/paged-event-list.tsx:198` header, `:221` cell). Timestamps come from
`formatAuditDate`, which is `new Date(iso).toLocaleString()` (`apps/web/src/lib/admin/format.ts:2`),
so the rendered width depends on locale, date digits and AM/PM. Security events happen to fit; some
audit events wrap at full desktop width. Close to the 1024 px breakpoint wrapping is tolerated for
now. Separately, the FE-042 completion notes record two flaky `patient-form.test.tsx` timeouts in the
full `test:web` run (they pass alone).

## Scope

- Make the Time cell stay on one line when space allows, in both audit and security event lists
  (they share `paged-event-list.tsx`). Candidate fix, to be confirmed in `/plan-task`:
  `whitespace-nowrap` on the Time header and cells, and replace the fixed `md:w-48` with a
  content-sized column (for example `w-px` with nowrap) so Action, Resource and Actor absorb
  shrinkage; optionally a fixed-format timestamp formatter for stable width.
- Keep the mobile card layout (below `md`) unchanged.
- Test hygiene: find and fix the cause of the `patient-form.test.tsx` timeouts in the full run.

## Out of Scope

- A new date format or time zone setting beyond what the width fix needs
- Other columns' content, filters (FE-046), paging (FE-043), or user-list layout
- Wrapping behaviour near the 1024 px breakpoint (tolerated; improve only if it falls out of the fix)
- Changes to any other flaky test unless the same cause is found

## Requirements

- At 1440 px and 1280 px no seeded audit or security-event timestamp wraps, including the longest
  locale form (two-digit day and hour, AM/PM).
- Wrapping of other columns is acceptable where needed to give the timestamp room.
- Header and cells stay aligned; table roles and accessible names are unchanged; text and controls
  keep their existing contrast and 44 px targets.
- The fix is CSS/markup only unless the formatter change is chosen; no API change.

## Acceptance Criteria

- [ ] At 1440 px, no timestamp wraps on the audit event list
- [ ] At 1440 px, no timestamp wraps on the security event list
- [ ] At 1280 px, no timestamp wraps on either list
- [ ] Near 1024 px, wrapping is allowed but the table has no horizontal page scroll
- [ ] Below `md` the stacked card layout is unchanged
- [ ] A unit test asserts the Time cell and header classes, and an e2e or width check covers
      1440 / 1280 / 1024 px
- [ ] Testing: the two `patient-form.test.tsx` timeouts are reproduced, their cause is recorded,
      and the fix lands in the test (for example `userEvent.setup({delay: null})`, a targeted
      timeout, or fewer renders), not through retries
- [ ] `npm run test:web` completes three consecutive runs with no timeout failures

## Testing todos

- [ ] Run the full `npm run test:web` and record the failing test names and durations for
      `patient-form.test.tsx`
- [ ] Run `patient-form.test.tsx` alone to confirm it passes in isolation
- [ ] Identify the cause (default 5 s timeout under load, slow typing, heavy form render) and note it
      in Completion
- [ ] Apply the narrowest fix in the test or its helper
- [ ] Repeat the full `test:web` run three times; delegate to the `test-runner` subagent
- [ ] Add a unit test for the Time column classes in `paged-event-list.test.tsx`
- [ ] Check widths in the built-in browser at 1440, 1280 and 1024 px in mock mode (the live seed has
      few events until DATA-006)

## Dependencies

- Blocked by: FE-043
- Related: FE-046, DATA-006, FE-042

## Validation

`npm run lint:web`, `type-check:web`, `test:web`, `e2e:mocks` (admin spec); visual check of
`/dashboard/admin` audit and security event lists at the three widths.

## Risks / considerations

- A content-sized column pushes width onto the other columns; check long `resourceType` plus id
  values still wrap acceptably and do not force horizontal scroll.
- `toLocaleString()` output differs between browsers and locales; test with the CI locale and a
  longer locale.
- Do not hide flakiness with a global timeout increase.

## Implementation notes

PATCH while `0.x` (layout fix, no contract change). No Figma change expected; if the table layout
changes visibly, note parity with the FE-043 Administration frames (node 243:82) in Completion.

## Completion

- Implementation:
- Tests:
- PR:
- Notes:
