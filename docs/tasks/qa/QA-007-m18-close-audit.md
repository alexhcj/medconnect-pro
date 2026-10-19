---
id: QA-007
type: task
area: qa
feature: deployment
status: implemented
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
  status: complete
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

- [x] QA-006 checks are repeated and recorded against the deployed commit
- [x] Patient sign-in and the demo panel match DATA-005 and FE-037
- [x] Public login does not start OAuth
- [x] Provider and patient share one session id
- [x] Media result is recorded (unavailable, or both connected, or the Daily error)
- [x] Receptionist join is denied
- [x] After end, neither participant can rejoin or mint media (evidence: ended-state UI for both participants on 2026-10-19, plus the 2026-10-16 provider-side 403s; not re-confirmed with an authenticated API call)
- [x] Release roadmap, post-MVP baseline, and AGENTS current position say M18 is shipped only after this evidence

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

- Implementation: Manual audit on 2026-10-16, completed by a two-browser recheck on 2026-10-19. No application, seed, or Render change. No version bump. M18 closed at 0.91.0.
- Tests: Manual only. `tests_required` is false.
- PR:
- Notes: Superseded by the 2026-10-19 recheck below, which passed and closed M18. The initial audit found that the patient portal user was not on the shared demo database, so the two-browser check did not run. An operator subsequently supplied the API seed log from 2026-10-16 13:07:50, confirming the DATA-005 patient `77777777-7777-4777-8777-777777777777` was linked to Avery Quinn through `portalUserId`; `SEED_ON_DEPLOY` was restored to false. The post-seed browser sign-in and two-browser journey still need verification. Do not reseed from this task. Owning behavior is DATA-005; this audit does not patch it.

  Live commits, all descendants of or equal to the INFRA-017 commit `c6c79b7f8b9b84b31caa915d97a4a1c7281412f1`. API deploy `dep-db8spf4s728c73ausjeg` is that commit, finished 2026-10-16T07:07:27Z. Web deploy `dep-db8vvls9v7es739cd5gg` and marketing deploy `dep-db8vvls9v7es739cd5lg` are `0fb02844e51f632757e757d2213d54e3a1dffbd6` (documentation and screenshots only), finished 2026-10-16T10:45:35Z and 2026-10-16T10:44:25Z. Hosts: `https://api.medconnectpro.app`, `https://medconnectpro.app`, `https://marketing.medconnectpro.app`. Render env, plans, domains, and `SEED_ON_DEPLOY` were left unchanged.

  The first API request waited about 43 seconds (free-tier cold start), separate from the checks below. `GET /health` returned 200 `{"status":"ok"}` in 43095 ms. `GET /ready` returned 200 `{"status":"ready"}` in 646 ms. Application `GET /` returned 307 to `/login`. Marketing `/` returned 200 and its sign-in link is `https://medconnectpro.app/login`.

  Signed-out `/login` shows Demo accounts for Practice admin, Provider, MFA nurse, and Patient, the line `MFA nurse code: 135790`, and the note “Provider sign-in is not configured for this demo. Use a demo account.” No provider button. No request to `/auth/oauth/fake/start` or `/auth/oauth/google/start`. Copy controls are named and in tab order. Activating **Copy email for Practice admin** announced “Email copied”. At 320px the sign-in card stays inside the viewport (`scrollWidth` 320) with no horizontal page scroll.

  `practice.admin@example.test` signed in as `PRACTICE_ADMIN`. `jordan.ellis@synthetic.example` signed in as `PROVIDER`. `mfa.nurse@example.test` reached **Verify mock MFA**, and code `135790` opened the dashboard as `NURSE`. `avery.quinn@synthetic.example` returned 401 `UNAUTHENTICATED` and stayed on `/login` with “Invalid email or password.” The practice directory lists only the practice admin, Jordan Ellis, and the MFA nurse. Avery Quinn is not a user row. The appointment was still created for the demographic patient.

  Provider scheduled telehealth appointment `f6e4a87c-8c1a-44c5-94dd-2692f3bfacc9` for Avery Quinn with Dr. Jordan Ellis, 2026-10-16 13:45–15:00 local, state Scheduled. **Join visit** opened `/dashboard/telehealth/159c856d-de71-4f31-b38f-b83ff4ca7371`. **Join session** showed “Live media is not configured in this environment” and “Live media unavailable”. The running API is not presenting a Daily key. The patient browser never reached that session.

  While the MFA nurse membership was temporarily `RECEPTIONIST` (admin PATCH 200, confirmed after reload), a new MFA sign-in still displayed `NURSE` and Telehealth in the nav, because the live client stores the fixture role for known demo emails. The server session was the receptionist membership: `POST .../join` returned 403 `FORBIDDEN` and `POST .../media-token` returned 403 `FORBIDDEN`. The membership was set back to `NURSE` (PATCH 200) and the directory confirmed `NURSE`.

  The first provider browser later showed `/login?reason=unauthorized` (“Your session ended. Sign in again.”). A second provider sign-in opened the concurrent-session dialog; **Continue Here Only** ended the other session. **End session** returned to the lobby. Reopening the same session id showed “This visit has ended” and “The consultation is closed. You cannot rejoin or mint live media for this session.” **Join visit** on that appointment stayed on the lobby with “A telehealth session for this appointment has already ended.” and did not create a new id. The patient could not attempt rejoin. The appointment and ended session were left in place. The database was not reseeded.

  Follow-up recheck: the public login panel still lists all four accounts and the provider-unavailable helper text. One later attempt to sign in as Avery Quinn returned the rendered `Too many attempts. Try again later.` rate-limit message before credentials could be checked. The subsequent operator-provided seed log confirms the account was seeded; the rate-limited browser path remains inconclusive. Wait for the limiter cooldown, then repeat one patient sign-in; do not retry around the limit.

  Recheck on 2026-10-19 (Playwright against the public demo, two isolated browser contexts; no seed, env, or code change). The first patient sign-in attempt returned 502 during an API cold start (`/health` took 63 s); it was not the rate limiter. After warm-up, `avery.quinn@synthetic.example` signed in once: `POST /auth/login` 200, "Signed in as PATIENT", no MFA step. Provider tried to schedule a new telehealth appointment and the form refused it: "This time overlaps an existing appointment for the provider." The audit reused the existing in-window Avery Quinn / Dr. Jordan Ellis visit (appointment `d33e2151-2f54-485a-94ab-963050bd07cb`, 2026-10-19 15:11–19:26 local).

  Provider and patient opened the same session id `3beaacdb-087e-4541-af2e-8641c37bb869`. Media: both shells showed **Connected** with the other participant's tile ("Avery Quinn" / "Dr. Jordan Ellis") and "Microphone is on", so a Daily key is now configured on the API. After the provider selected **End session**, both the patient and the provider reloaded the session id and saw "The consultation is closed. You cannot rejoin or mint live media for this session." Direct `POST .../join` and `.../media-token` from the page returned 401 because the script's cross-origin fetch carried no credentials, so those two status codes are not lockout evidence; the denial evidence is the ended-state UI here and the 10-16 provider-side 403 and no-new-session result. Not independently re-confirmed with an authenticated API call.
