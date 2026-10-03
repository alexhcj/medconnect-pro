---
id: INFRA-013
type: task
area: infrastructure
feature: deployment
status: pending
priority: high
estimate: 3
dependencies: [INFRA-004, INFRA-005, INFRA-006, INFRA-007, INFRA-008, INFRA-009, INFRA-010, INFRA-011, INFRA-012]
related_adrs: [ADR-005, ADR-007, ADR-012]
related_docs:
  [
    ../workflows/release.md,
    ../workflows/versioning.md,
    ../marketing/capability-matrix.md,
    ../roadmap/post-mvp-baseline.md,
    ../roadmap/release-roadmap.md,
    ../00-project-spec.md,
  ]
implementation:
  status: not_started
validation:
  responsive: false
  accessibility: false
  tests_required: true
plane:
  work_item_id: 3a9d46d5-9e44-4513-8905-66860957aa03
  identifier: MEDCONNECT-69
---

# INFRA-013 — v1.0.0 production release readiness

## Objective

Prove AWS production is up, run smoke checks, fill the GitHub release notes, and — with the
explicit human approval recorded in the M9 brief — tag and record **1.0.0**.

## Context

Why this task exists: M9 ends at `main` → AWS production → `v1.0.0`.
[ADR-007](../../decisions/ADR-007-semantic-versioning.md) forbids a silent major bump. This
task is the explicit request.

This is a portfolio/demo application containing synthetic data only. Do not claim HIPAA
compliance or suitability for real patient data.

## Scope

- Production configuration audit: environment variables, secrets, CORS, API URL, mocks off.
- Database migrated; synthetic seed present; no PHI.
- Authentication: seeded demo login works; still labeled mock IdP, not production OAuth.
- API `/health`, `/ready`, and one authorized domain GET.
- Frontend marketing and dashboard smoke on the production Amplify URL.
- Security-sensitive checks: Swagger UI off, secrets not in the client bundle, preview and
  production isolation.
- Rollback notes from INFRA-011 confirmed.
- Fill [docs/releases/github-release-notes-template.md](../../releases/github-release-notes-template.md)
  into the GitHub pre-release / release text.
- Bump the root package (and `apps/web` if mirrored) to `1.0.0` and add a CHANGELOG entry.
  Create a git tag only if the user asks to commit or tag at execution time.
- Update roadmaps: M9 shipped. Marketing copy may say “hosted demo” only after this lands —
  still no HIPAA claim.

## Out of scope

- OAuth 2.0 / OIDC cutover
- HIPAA assessment or certification
- Claiming production PHI readiness
- Live Daily / WebRTC, payments, Redis, SNS/SQS
- Re-implementing INFRA-004–INFRA-012

## Requirements

- Production Amplify, production ECS API, and production/demo RDS are live.
- Smoke evidence is written into the task Completion section.
- GitHub `1.0.0` notes use the project template.
- Version `1.0.0` is recorded per ADR-007.
- Capability matrix and post-MVP baseline no longer say there is no hosted production.
- Synthetic/demo data only. Never introduce real PHI.

## Technical constraints

- Follow ADR-005, ADR-007, and ADR-012.
- Do not enable Swagger UI in production unless an explicit demo exception is documented.
- Do not put secrets in the release notes.
- Do not claim HIPAA compliance.

## Acceptance criteria

- [ ] Production Amplify + production API + production/demo database are live
- [ ] Written smoke evidence exists (marketing, login, one dashboard list, `/health`, `/ready`)
- [ ] GitHub release notes for `1.0.0` use the INFRA-012 template
- [ ] Application version is `1.0.0` per ADR-007
- [ ] Capability matrix and post-MVP baseline no longer say “no hosted production”
- [ ] Copy still states synthetic data only and does not claim HIPAA compliance
- [ ] Rollback path from INFRA-011 remains documented and usable

## Dependencies

- Blocked by: INFRA-004 through INFRA-012
- Related: ADR-007, ADR-005, release.md, capability-matrix

## Validation

Execute this checklist against the real production URLs (not localhost):

1. Production configuration audit (env, secrets, CORS, API URL, `NEXT_PUBLIC_USE_MOCKS=false`).
2. Database migrated; seed users are the documented synthetic demo accounts.
3. `GET /health` and `GET /ready` succeed over HTTPS.
4. One authorized API GET with a demo bearer.
5. Browser: `/`, `/login`, dashboard list page on the Amplify production URL.
6. Client bundle has no database URLs or AWS keys.
7. Preview still cannot read production secrets.
8. Release notes filled from the template; version `1.0.0` recorded.
9. Update [release-roadmap.md](../../roadmap/release-roadmap.md) to
   `INFRA-004–INFRA-013 (shipped)` and move current position off “M9 remaining.”

## Documentation impact

- CHANGELOG `## [1.0.0]`
- release-roadmap, post-mvp-baseline, product/frontend/backend roadmaps as needed
- capability-matrix hosted-demo row
- [00-project-spec.md](../../00-project-spec.md) current position
- GitHub release text

## Risks / considerations

- Do not ship `1.0.0` if production smoke fails. Keep the 0.x version until the gate passes.
- Marketing pages must not grow HIPAA or “production patient data” claims when the hosted
  demo goes live.
- Git tag and GitHub release creation still require an explicit user request at execution
  time if repository policy forbids unsolicited tags.

## Implementation notes

Suggested implementation order: last M9 task.

This task is the only M9 task allowed to bump to `1.0.0`. Writing the spec is not a version
bump.

## Completion

- Implementation:
- Tests:
- PR:
- Notes: Pending M9 implementation.
