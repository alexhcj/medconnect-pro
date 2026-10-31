---
id: INFRA-021
type: task
area: infrastructure
feature: deployment
status: pending
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
  status: not_started
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

- [ ] The root version and lockfile are 1.0.0, with a CHANGELOG entry.
- [ ] The release notes follow the INFRA-012 template and state the hosting limits.
- [ ] Every progress tracker shows 1.0.0, and `npm run docs:marketing-sync` passes.
- [ ] A pre-bump `/release-check 1.0.0` GO and a post-bump run with no FAIL are recorded in
  Completion.
- [ ] The tag and GitHub release are created only after the user approves.

## Dependencies

- Blocked by: QA-010, QA-012, FE-051 to FE-060 (all shipped); M20 and M21 are closed (2026-10-31). Related:
  INFRA-012, INFRA-013, INFRA-023 (does not block).

## Validation

Run `npm run docs:marketing-sync`, confirm `ci` is green, and run the smoke checks against the
Render demo.

## Roadmap

Standalone release step. Moved out of M21 by the M21 close audit on 2026-10-31: it runs after M20
and M21 are closed, so it cannot close inside M21. FE-061 and QA-013 follow it.
