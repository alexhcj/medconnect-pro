---
id: INFRA-021
type: task
area: infrastructure
feature: deployment
status: implemented
priority: high
estimate: 2
dependencies: [INFRA-012, QA-010, QA-012, FE-051, FE-052, FE-053, FE-054, FE-055, FE-056, FE-057, FE-058, FE-059, FE-060]
related_adrs: [ADR-007-semantic-versioning.md, ADR-017-interim-render-demo.md]
related_docs:
  [
    ../../workflows/release.md,
    ../../workflows/versioning.md,
    ../../roadmap/release-roadmap.md,
    ../../marketing/capability-matrix.md,
    INFRA-012-github-v1.0.0-release-notes-template.md,
    INFRA-013-v1.0.0-production-release-readiness.md,
  ]
implementation:
  status: complete
validation:
  responsive: false
  accessibility: false
  tests_required: true
plane:
  work_item_id: db1fff5d-f3a7-43e1-b66e-482ada69792d
  identifier: MEDCONNECT-147
---

# INFRA-021 — 1.0.0 demo release

## Objective

Release **1.0.0** as the feature-complete synthetic demo on Render once M20 and M21 are closed.

## Context

1.0.0 was tied to INFRA-013 (AWS production readiness), which is blocked on INFRA-014 because there
is no AWS account. On 2026-10-28 the user decided that 1.0.0 marks the feature-complete Render demo
after M21, and that AWS production becomes a later 1.x release. INFRA-013 is retitled for that later
release and no longer gates 1.0.0.

## Scope

- Check the prerequisites:
  - the user has closed M20 (QA-010) and M21 (both closed 2026-10-31);
  - `ci` is green on `main`;
  - smoke checks pass for the Render demo and the marketing site (QA-006 flow);
  - `/release-check 1.0.0` on the commit that `main` will release reports GO or GO with manual
    items, and every manual item is done or accepted by the user
    ([release.md](../../workflows/release.md) "When to run the release check").
- Bump 0.x → 1.0.0. Per ADR-007 this MAJOR bump happens only because the user asked for it. Update
  the lockfile root and add a CHANGELOG entry.
- Write the release notes from the INFRA-012 template. They state Render hosting, synthetic data,
  no HIPAA claim and no AWS production.
- Update the roadmap, the `AGENTS.md` Current line, the master task list and the capability matrix
  "Last synced release".
- After the bump, run `/release-check 1.0.0 --skip ci,db,build,e2e,browser` (post-bump mode:
  every tracker must say 1.0.0). Merge through a PR; once `ci` is green on `main`, the tag
  `v1.0.0` goes on that `main` commit.
- Create the tag and GitHub release only when the user explicitly says go in that session.

## Out of Scope

- AWS production (INFRA-013, INFRA-014).
- New features.

## Requirements

- After the bump, no marketing or README claim goes beyond the capability matrix.

## Acceptance Criteria

- [x] The root version and lockfile are 1.0.0, with a CHANGELOG entry.
- [x] The release notes follow the INFRA-012 template and state the hosting limits.
- [x] Every progress tracker shows 1.0.0, and `npm run docs:marketing-sync` passes.
- [ ] A pre-bump `/release-check 1.0.0` GO and a post-bump run with no FAIL are recorded in
  Completion.
- [ ] The tag and GitHub release are created only after the user approves.

## Dependencies

- Blocked by: QA-010, QA-012, FE-051 to FE-060 (all shipped); M20 and M21 are closed (2026-10-31). Related:
  INFRA-012, INFRA-013, INFRA-023 (does not block).

## Validation

Run `npm run docs:marketing-sync`, confirm `ci` is green, and run the smoke checks against the
Render demo.

## Completion

- Implementation: complete (2026-10-31) on `release/v1.0.0`. Version 0.103.7 → 1.0.0 (MAJOR on the
  user's explicit approval of the INFRA-021 plan; ADR-007).
- Release notes: [v1.0.0-release-notes.md](../../releases/v1.0.0-release-notes.md), in the INFRA-012
  template's section order, rewritten for Render (hosting limits, Free Postgres expiry 2026-11-13,
  no AWS production, no HIPAA claim). The template now serves the AWS 1.x release (INFRA-013);
  `release.md`, the template header and `render-demo-note.md` point 1.0.0 at the new notes.
- Trackers: roadmap Current position, M9 text, standalone crosswalk row; `AGENTS.md`; README;
  master task list; capability matrix ("Last synced release: 1.0.0" and the About board rule);
  `/about` board (1.0.0 Shipped, accessibility follow-ups In progress, Telehealth 2.0 Up next).
- Pre-bump `/release-check 1.0.0`: NO-GO on `8d757c3` only for a stale `README.md` (fixed in
  #13); then **GO with manual items** on `main` `71a62d4` (2026-10-31). Full run on `8d757c3`: web
  749 and marketing 117 unit tests, API 616, mock e2e 67/67, builds, 0 production audit advisories,
  4-role local walkthrough, live smoke and 320 px marketing check. Re-run on `71a62d4` (code
  unchanged): CI gates, trackers, live smoke and 320 px PASS.
- Manual items from the pre-bump check, accepted by the user (2026-11-01):
  - Signed-in live smoke (owner): practice admin signs in, reloads, opens the patient list and edits
    one synthetic record. Document upload has no web UI (only `POST /patients/:id/documents`), so
    the upload and download step was not run; `deploy-render.md` "Smoke" now says to upload through
    the API and download in the app.
  - Client IP: not observable. The API does not log client addresses (it uses them only as
    rate-limit keys, `apps/api/src/rate-limit/rate-limit.policies.ts`), and the Render request log
    for the API was empty. The smoke step is reworded.
  - Migrations: the `medconnect-api` start log for the `8d757c3` deploy (2026-10-31 18:09:49 UTC)
    says "No migrations are pending", so all 13 files in `apps/api/src/persistence/migrations` are
    applied. The newest (`RateLimitBuckets`) is from M15; 1.0.0 adds no schema change, so an API
    rollback needs no `migration:revert`.
  - Free instance hours: the monthly counter reset on 2026-11-01 before it was read (2.63 h / 750 h
    that day); October's total was not captured. Custom domains read 4 / 2 (INFRA-023).
- Post-bump `/release-check 1.0.0`: not run yet (needs the pushed branch and `ci`).
- Tag and GitHub release: not created; the user runs them after the merge.

## Roadmap

Standalone release step. Moved out of M21 by the M21 close audit on 2026-10-31: it runs after M20
and M21 are closed, so it cannot close inside M21. FE-061 and QA-013 follow it.
