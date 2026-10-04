---
id: INFRA-012
type: task
area: infrastructure
feature: deployment
status: implemented
priority: medium
estimate: 1
dependencies: []
related_adrs: [ADR-005, ADR-007]
related_docs:
  [
    ../workflows/release.md,
    ../marketing/capability-matrix.md,
    ../roadmap/post-mvp-baseline.md,
    ../roadmap/release-roadmap.md,
  ]
implementation:
  status: complete
validation:
  responsive: false
  accessibility: false
  tests_required: false
plane:
  work_item_id: a182140a-cfa4-41f2-bbb2-6d19b2327c7c
  identifier: MEDCONNECT-68
---

# INFRA-012 — GitHub v1.0.0 release-notes template

## Objective

Create a reusable GitHub pre-release / release-notes template written for MedConnect Pro’s
actual `1.0.0` production release, not a generic software changelog dump.

## Context

Why this task exists: the GitHub release UI needs a project-specific outline that covers
product scope, infrastructure, security, and the synthetic-data / no-PHI statement.
[INFRA-013](INFRA-013-v1.0.0-production-release-readiness.md) fills the template for the
real `1.0.0` notes.

No blocking implementation dependency. Best after INFRA-004 so environment names are
local / preview / production.

## Scope

Create [docs/releases/github-release-notes-template.md](../../releases/github-release-notes-template.md)
and a short pointer in [release.md](../../workflows/release.md). Required sections:

- release overview
- product / feature scope (M0–M8 shipped + M9 hosting)
- frontend
- backend
- API
- database
- infrastructure
- deployment
- environment separation
- security
- authentication (mock IdP; not production OAuth)
- testing / QA
- UI / UX / design
- documentation
- known limitations (no HIPAA, no live video, no payments, shared preview API, and other
  current demo boundaries)
- demo-data / no-PHI statement
- release verification
- rollback considerations
- future work

## Out of scope

- Auto-publishing GitHub releases
- Filling the final `1.0.0` notes (INFRA-013)
- Bumping the application version
- Inventing capabilities the product does not have

## Requirements

- The template is MedConnect-specific and suitable for the `1.0.0` production release.
- It covers the complete release, not only code changes.
- It must not claim HIPAA compliance, production OAuth, live telehealth media, hosted
  payments, or real PHI.

## Technical constraints

- Follow [ADR-005](../../decisions/ADR-005-synthetic-demo-data.md) and
  [ADR-007](../../decisions/ADR-007-semantic-versioning.md).
- Align wording with [capability-matrix.md](../../marketing/capability-matrix.md) and
  [post-mvp-baseline.md](../../roadmap/post-mvp-baseline.md).
- Do not put secrets, tokens, or real patient information in the template.

## Acceptance criteria

- [x] `docs/releases/github-release-notes-template.md` exists
- [x] [release.md](../../workflows/release.md) points at the template
- [x] The template includes every section listed in Scope
- [x] Copy does not claim HIPAA certification or production identity infrastructure

## Dependencies

- None blocking
- Related: INFRA-013 (consumer), INFRA-004 (environment names), ADR-005, ADR-007

## Validation

- Editorial review against the capability matrix and post-MVP baseline.
- Confirm every scoped section is present.
- No automated test harness is required.

## Documentation impact

- New release-notes template
- release.md link
- release-roadmap shipped/pending split when this task ships

## Risks / considerations

- A generic Keep-a-Changelog paste is not enough. Interviewers will read this as the
  product’s first production story.
- Do not pre-fill INFRA-013 evidence in the template; leave placeholders.

## Implementation notes

Suggested implementation order: parallel after INFRA-004; complete before INFRA-013.

Writing this documentation-only slice is not a version bump.

## Completion

- Implementation: Added
  [docs/releases/github-release-notes-template.md](../../releases/github-release-notes-template.md)
  with every scoped section and `[INFRA-013: …]` placeholders. Pointed
  [release.md](../../workflows/release.md) and [docs/README.md](../../README.md) at the template.
  M9 index is INFRA-004–INFRA-012 shipped, INFRA-013 pending.
- Tests: None required (`tests_required: false`). Editorial pass against the capability matrix
  and post-MVP baseline; no HIPAA or production-OAuth claims.
- PR:
- Notes: Documentation-only; no version bump (still 0.59.0). Do not fill production URLs or
  tag `1.0.0` here — that is INFRA-013.
