---
id: QA-007
type: task
area: qa
feature: deployment
status: pending
priority: high
estimate: 3
dependencies: [QA-006, DATA-005, BE-024, FE-037, FE-038, FE-039, INFRA-017]
related_adrs: [ADR-005-synthetic-demo-data.md, ADR-017-interim-render-demo.md]
related_docs:
  [
    ../../workflows/deploy-render.md,
    ../../roadmap/release-roadmap.md,
    ../../roadmap/post-mvp-baseline.md,
    ../../product/identity-access.md,
    ../../product/telehealth.md,
    ../../marketing/capability-matrix.md,
    QA-006-live-demo-smoke.md,
  ]
implementation:
  status: not_started
validation:
  responsive: true
  accessibility: true
  tests_required: false
plane:
  work_item_id: ab848502-e83a-4615-a0e6-4c773e1ffab8
  identifier: MEDCONNECT-116
---

# QA-007 — M18 close audit

## Objective

Re-check the interviewer journey on the deployed commit and close M18 only if that journey holds.

## Context

QA-006 records the demo before the M18 fixes. This task repeats that smoke after DATA-005,
BE-024, FE-037, FE-038, FE-039, and INFRA-017. M17 stays closed. M9 stays paused. Closing M18
does not close INFRA-013 or INFRA-014.

## Scope

On the deployed commit named by INFRA-017:

- Repeat the QA-006 host checks
- Demo account panel shows four roles, copy actions, and the MFA code
- OAuth button is absent and the helper text is present
- Two browsers: provider creates an in-window visit; patient joins; both reach the same session
- Without `DAILY_API_KEY`, both shells say media is unavailable
- If the operator has set `DAILY_API_KEY`, both connect, or Completion records the Daily failure
- Receptionist cannot join
- End visit locks both participants out of rejoining
- Move the M18 crosswalk to shipped only when the checks pass

## Out of Scope

- New features found during the audit
- Render PR previews
- Google OAuth credentials
- Chat, recording, Socket.IO, hosted Stripe, Redis
- Upgrading Postgres or web plans (operator notes only)
- Reopening M9 or M17

## Requirements

- Synthetic data only. No secrets in the notes.
- Do not set `SEED_ON_DEPLOY=true` to force a visit window.
- A failed two-browser check leaves M18 open.

## Acceptance criteria

- [ ] QA-006 checks are repeated and recorded against the deployed commit
- [ ] Patient sign-in and the demo panel match DATA-005 and FE-037
- [ ] Public login does not start OAuth
- [ ] Provider and patient share one session id
- [ ] Media result is recorded (unavailable, or both connected, or the Daily error)
- [ ] Receptionist join is denied
- [ ] After end, neither participant can rejoin or mint media
- [ ] Release roadmap, post-MVP baseline, and AGENTS current position say M18 is shipped only after this evidence

## Dependencies

- Blocked by: QA-006, DATA-005, BE-024, FE-037, FE-038, FE-039, INFRA-017
- Related: INFRA-015, INFRA-016

## Validation

Manual two-browser pass on the public demo, plus a narrow-width check of the login panel.
Automated tests stay in the implementation tasks. This task is the milestone gate.

## Risks / considerations

- Sign-in and ending a visit write rows on the shared demo database. Do not reseed afterward.
- Free-tier cold start can look like a defect. Record the wait separately from a failed join.
- Two-way video is optional. Application join is required.

## Implementation notes

No application version bump for the audit itself. If the audit finds a defect, fix it in the
owning task and bump there.

## Completion

- Implementation:
- Tests:
- PR:
- Notes: Not started. M18 stays pending until this section records a passing two-browser check.
