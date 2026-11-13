---
id: QA-015
type: task
area: qa
feature: telehealth
status: implemented
priority: high
estimate: 1
dependencies: [FE-066]
related_adrs: [ADR-008-frontend-testing-stack.md]
related_docs:
  [
    ../../workflows/frontend-testing.md,
    FE-066-muted-text-contrast-on-subtle-surfaces.md,
    QA-014-m22-verification-and-close-audit.md,
    ../frontend/FE-067-green-room-for-later-joiners.md,
  ]
validation:
  responsive: false
  accessibility: false
  tests_required: true
plane:
  work_item_id: 4249a255-8f01-4239-8499-967b9eaee2b7
  identifier: MEDCONNECT-169
---

# QA-015 — Telehealth live three-participant spec times out

## Objective

Find why the live three-participant telehealth spec times out in a full `npm run e2e:live` run, and fix
the spec, the app or the run procedure so `npm run e2e:live` is green on a fresh seed.

## Context

FE-066 cleared the `auth` live failures, so the full live suite ran for the first time since QA-014
(2026-11-10, local stack, fresh seed, limiter reset). 36 of 37 tests passed. The failure:

- `telehealth-live.spec.ts` "Live telehealth visit with three participants > provider, patient and nurse
  share one visit; only the host ends it" ([telehealth-live.spec.ts:74](../../../apps/web/e2e/telehealth-live.spec.ts)
  at planning time; line numbers move with edits).
- Test timeout of 120000 ms. The reported error is `browserContext.close` in the `finally` block
  (`patient.context.close()`), which is the cleanup after the timeout, not the cause.
- The error-context snapshot shows the provider page on the session screen with the "Video visit" region;
  which step stalled was not established.

QA-014 recorded this spec as passing on a fresh seed, but run through the `setup`, `app` and `teardown`
projects separately (the `auth` failures blocked a joint run). So it has not been shown to pass in one
`e2e:live` run. Planning text (historical): this section first said FE-067 was not the cause because the spec
accepted either the green room or the stage. FE-067 had in fact already changed the spec to require the green
room; see the audit note in Completion.

## Scope

- Re-run the spec alone and in the full suite, with a trace (`--trace on`), and record which step stalls
  and in which of the three browser contexts.
- Decide the cause: a spec step (selector, wait or the 120 s budget across three contexts), the app, the
  Fake Daily adapter, or run state (visit join window of about 4 hours, session or limiter state left by
  earlier specs).
- Fix it where the cause is, or log a separate task if the cause is an app defect.
- Record the cause and the green run in Completion.

## Out of Scope

- New telehealth behaviour, including the FE-067 later-joiner green room.
- Real Daily media (the local API uses the Fake Daily adapter).
- Mock e2e specs.

## Requirements

- Do not raise the test timeout to hide a stall without recording what the extra time covers.
- The fix keeps the spec's assertions (passive header, heartbeat 204 for all three, host-only End visit,
  leave and rejoin, wrap-up and visit-ended views).

## Acceptance Criteria

- [x] The stalled step and the context it stalls in are recorded in Completion, with the trace evidence
- [x] The cause is fixed, or an app defect is logged as its own task with the evidence
- [x] `npm run e2e:live` passes in full on a fresh seed, twice in a row (QA-014's live criterion)
- [x] Spec assertions are unchanged or only strengthened
- [x] CHANGELOG and version only if app code changed (PATCH); a test-only fix needs no bump (no app code changed)

## Dependencies

- Builds on FE-066 (the `auth` project must pass for the suite to reach this spec).
- Unblocks the live-suite acceptance criterion of QA-014.

## Validation

The live procedure in [frontend-testing.md](../../workflows/frontend-testing.md): `docker compose up -d
postgres`, `npm run migration:run`, `npm run seed:mock-identity`, API on :3001 with `APP_ENV=local`,
reset limiter and session state, then `npm run e2e:live`. Two runs fit inside the sign-in rate limit.

## Risks / Considerations

- Each full run uses sign-ins from the 5-per-15-minute account limit; reset limiter state between runs.
- The seeded visit is joinable for about 4 hours after seeding; a late run can fail for that reason alone.

## Versioning

Test-only fix: no bump. App fix after 1.0.0: compatible fix, PATCH.

## Roadmap

Standalone. Found by the FE-066 live run on 2026-11-10. It does not belong to M22 (the spec exists; the
failure is in the joint run), but QA-014's live-suite criterion cannot be ticked until it ships.

## Completion

Implemented 2026-11-13. Test-only change: no app code, no version bump, no CHANGELOG entry (latest release stays
1.6.4). Local stack, Fake Daily adapter, `npm run seed:mock-identity` and a limiter reset before each run.

- **Audit note.** The Context section was written before FE-067 landed. The spec's "accepts either the green room
  or the stage" lines (then 42-48) were replaced by FE-067 (`e10f78a`) with a required green room, the
  "This visit has already started" line and a no-`media-token`-before-Join check. The Context line references
  are corrected or marked historical; the failing run reproduced on that FE-067 version of the spec, so FE-067 is not the cause.
- **Reproduced.** Spec alone with `--trace on` (setup dependencies stop at an `auth` failure, see below) and the
  full suite with `--trace on`: 36 of 37 passed, the telehealth spec timed out at 120 s with the same
  `patient.context.close()` error as the FE-066 run.
- **Stalled step and context.** The trace has one file per browser context. The provider (`1-trace`) and the
  patient (`5-trace`) completed every step through "Join visit" and the stage. The nurse (`4-trace`) stalled on
  its first action after `goto('/dashboard/telehealth')`: `click` on "Join visit" in the lobby never completed.
  Its call log repeats `<div class="flex min-h-full ..."> from <div id="headlessui-portal-root"> subtree
  intercepts pointer events` with growing back-off until the test timeout ended it.
- **Cause: run state, not the spec logic, the app or the adapter.** `ConcurrentSessionDialog`
  (`apps/web/src/components/session/concurrent-session-dialog.tsx`) opens "Multiple Sessions Detected" when
  `/auth/sessions` lists more than one session, which is the intended behaviour. In a full run the MFA nurse had
  two open sessions: `auth-mfa-live` signed in (08:38:41) and never signed out, and `setup` signed the same
  account in again for the telehealth spec (08:39:05). The modal covered the nurse's lobby. QA-014 passed the spec
  only because it ran `setup`, `app` and `teardown` without `auth-mfa-live`. The provider and patient have one
  session each, so only the nurse was affected. The 120 s was not a budget problem: the extra time was the click
  retrying behind the modal, so the timeout is unchanged.
- **Fix.** (1) [auth-mfa-live.spec.ts](../../../apps/web/e2e/auth-mfa-live.spec.ts) now ends its own session
  with "Sign out" after its assertions, so `setup` holds the nurse's only session. (2) In
  [telehealth-live.spec.ts](../../../apps/web/e2e/telehealth-live.spec.ts) the lobby "Join visit" click has a
  15 s limit, so a blocking modal fails at that step with the intercepting element in the call log, not in
  `context.close()` after 120 s. No assertion was removed or loosened.
- **Second finding, fixed here.** The first full run also failed `auth-oauth-live` "shows a generic error when the
  callback fails" (strict mode: `getByRole('alert')` matched the error and Next's `__next-route-announcer__`,
  also `role="alert"`). It passed alone, so it is a race on when the announcer mounts. The locator now filters
  by the error text; the assertion text is unchanged and now also requires visibility.
- **Result.** `npm run e2e:live` on a fresh seed with a limiter reset, twice in a row: 37 passed (1.3 m) and
  37 passed (1.0 m). `npm run lint:web`: 0 errors (11 existing warnings, none in `e2e/`); `npm run
  type-check:web`: clean.
- **FE-067 live criteria.** The live no-`media-token`-before-Join check and the live green room for the patient
  and nurse are covered by the two green runs; ticked on FE-067 with this evidence. FE-067's Render two-browser
  run and keyboard/screen-reader pass stay open.
- **QA-014.** Its live-suite criterion is no longer blocked by this spec; QA-014 still needs its second mock run
  and the rest of its list.
