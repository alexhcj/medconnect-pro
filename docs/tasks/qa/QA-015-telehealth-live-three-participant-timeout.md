---
id: QA-015
type: task
area: qa
feature: telehealth
status: pending
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
  share one visit; only the host ends it" ([telehealth-live.spec.ts:64](../../../apps/web/e2e/telehealth-live.spec.ts)).
- Test timeout of 120000 ms. The reported error is `browserContext.close` in the `finally` block
  (`patient.context.close()`, line 129), which is the cleanup after the timeout, not the cause.
- The error-context snapshot shows the provider page on the session screen with the "Video visit" region;
  which step stalled was not established.

QA-014 recorded this spec as passing on a fresh seed, but run through the `setup`, `app` and `teardown`
projects separately (the `auth` failures blocked a joint run). So it has not been shown to pass in one
`e2e:live` run. FE-067 (later joiners skip the green room) is not the cause: the spec already accepts
either the green room or the stage for each participant (lines 42-48).

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

- [ ] The stalled step and the context it stalls in are recorded in Completion, with the trace evidence
- [ ] The cause is fixed, or an app defect is logged as its own task with the evidence
- [ ] `npm run e2e:live` passes in full on a fresh seed, twice in a row (QA-014's live criterion)
- [ ] Spec assertions are unchanged or only strengthened
- [ ] CHANGELOG and version only if app code changed (PATCH); a test-only fix needs no bump

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
