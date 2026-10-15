---
id: QA-006
type: task
area: qa
feature: deployment
status: implemented
priority: high
estimate: 2
dependencies: []
related_adrs: [ADR-005-synthetic-demo-data.md, ADR-017-interim-render-demo.md]
related_docs:
  [
    ../../workflows/deploy-render.md,
    ../../roadmap/release-roadmap.md,
    ../infrastructure/INFRA-015-render-public-demo.md,
    ../infrastructure/INFRA-016-render-marketing-static-site.md,
  ]
implementation:
  status: complete
validation:
  responsive: false
  accessibility: false
  tests_required: false
plane:
  work_item_id: bdec2bde-c4fa-470c-86a3-0ef16f0b2f99
  identifier: MEDCONNECT-109
---

# QA-006 — Live demo smoke

## Objective

Record what the existing Render demo actually does for an interviewer, before later M18 tasks
treat a code hypothesis as fixed.

## Context

M18 is interview-demo readiness on the interim Render host. INFRA-015 and INFRA-016 are already
implemented. This audit did not sign in. Passwords live in the mock IdP, not in Postgres, so
they cannot drift if the seed rows exist. Whether those rows exist on Render is unverified.
Signing in writes session and audit rows. Do not reseed to clean that up.

## Scope

Operator smoke against the current public demo, without changing Render env vars, plans, or
domains:

- `GET` API `/health` and `/ready`
- Application `/` and `/login`, and the marketing origin
- Sign-in as the three existing mock accounts, including MFA code `135790`
- Click the public OAuth button and record the response
- One in-window telehealth visit if a staff user can schedule one
- Confirm a nurse cannot enter from the lobby, and that no patient login exists yet

Write the evidence in this task’s Completion notes. Do not commit secrets, cookies, or tokens.

## Out of Scope

- Code, seed, Blueprint, or dashboard changes
- Adding the patient account (DATA-005)
- Fixing OAuth or telehealth (FE-039, BE-024, FE-038)
- Two-way Daily video
- Closing M18 (QA-007)

## Requirements

- Use the hosts in [deploy-render.md](../../workflows/deploy-render.md). Synthetic data only.
- Do not set `SEED_ON_DEPLOY=true`.
- Do not print database URLs or passwords beyond the already public demo fixtures.

## Acceptance criteria

- [x] Completion notes name the commit or deploy checked, and the three hosts
- [x] `/health` and `/ready` results are recorded
- [x] Each of practice admin, provider, and MFA nurse is recorded as success or failure, including the MFA step
- [x] The OAuth click’s status and error code are recorded
- [x] Lobby behavior for a non-writer (nurse) is recorded
- [x] No Render configuration was changed to produce the notes

## Dependencies

- None. This is the first M18 check.
- Related: INFRA-015, INFRA-016, FE-033, FE-035

## Validation

Manual only. Follow the scope list on the live hosts. A failing check stays a finding; do not
patch the app in this task.

## Risks / considerations

- Sign-in creates audit and session rows on the shared demo database.
- Free web services may be asleep. Record cold-start delay if the first request waits.
- Free Postgres expires on 2026-11-13. This task does not upgrade it.

## Implementation notes

Do this before claiming DATA-005, BE-024, FE-037, FE-038, or FE-039 fixed a live defect. Those
tasks may still be specified from the repository; this smoke confirms the host.

## Completion

- Implementation: Manual smoke on 2026-10-15 against the live Render demo. No application, seed, or Render change. No version bump.
- Tests: Manual only. `tests_required` is false.
- PR:
- Notes: Checked commit `70d676039fdeaa418ab9a7540904b9bb816f8a28` (0.86.1) on all three services. API deploy `dep-db890gh42hec73c1oo6g` finished 2026-10-15T08:37:21Z. Web deploy `dep-db890gh42hec73c1oo2g` finished 2026-10-15T08:37:25Z. Marketing deploy `dep-db8aia8u01pc73f4fr90` finished 2026-10-15T10:22:35Z. Hosts that answered: `https://api.medconnectpro.app`, `https://medconnectpro.app`, `https://marketing.medconnectpro.app`. Custom domains resolved, so the `onrender.com` names were not used. Render env vars, plans, domains, and `SEED_ON_DEPLOY` were left unchanged.

  First-request times were about 1.2–2.2 seconds, so this pass did not see a long free-tier spin-up. `GET /health` returned 200 `{"status":"ok"}` in 1592 ms. `GET /ready` returned 200 `{"status":"ready"}` in about 1.5 seconds. Application `GET /` returned 307 to `/login`. `/login` returned 200 and listed practice admin and the MFA nurse only. No patient account was listed. Marketing `/` returned 200 and its sign-in links point at `https://medconnectpro.app/login`.

  One click of **Continue with Fake provider (demo)**, while signed out, navigated to `/mcp-api/auth/oauth/fake/start?returnTo=/dashboard`. The navigation status was 400. The public envelope code was `VALIDATION_ERROR` and the message was `Unknown OAuth provider`.

  `practice.admin@example.test` signed in and the dashboard showed `PRACTICE_ADMIN`. `jordan.ellis@synthetic.example` signed in and the dashboard showed `PROVIDER`. That sign-in opened the concurrent-session dialog for another session last active 5 hours earlier; **Continue Here Only** ended that other session, which is what that control already does. `mfa.nurse@example.test` reached **Verify mock MFA** after the password step, and code `135790` opened the dashboard as `NURSE`.

  Practice admin scheduled a synthetic telehealth appointment for Avery Quinn with Dr. Jordan Ellis, 2026-10-15 18:42–19:17 local, state Scheduled. The lobby listed it. **Join visit** opened the session shell waiting room. **Join session** then showed “You do not have permission to perform this action”, so the media-unavailable label was not reached. After a second MFA nurse sign-in, the same visit was listed in the nurse lobby. One **Join visit** click showed the alert “You do not have permission to perform this action” and stayed on `/dashboard/telehealth`. The session shell did not open. The appointment and session rows were left in place. The database was not reseeded.
