---
id: QA-006
type: task
area: qa
feature: deployment
status: pending
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
  status: not_started
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

- [ ] Completion notes name the commit or deploy checked, and the three hosts
- [ ] `/health` and `/ready` results are recorded
- [ ] Each of practice admin, provider, and MFA nurse is recorded as success or failure, including the MFA step
- [ ] The OAuth click’s status and error code are recorded
- [ ] Lobby behavior for a non-writer (nurse) is recorded
- [ ] No Render configuration was changed to produce the notes

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

- Implementation:
- Tests:
- PR:
- Notes: Not started.
