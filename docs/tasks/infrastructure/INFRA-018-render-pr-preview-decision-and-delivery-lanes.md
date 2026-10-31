---
id: INFRA-018
type: task
area: infrastructure
feature: deployment
status: completed
priority: high
estimate: 2
dependencies: [INFRA-015, INFRA-016]
related_adrs: [ADR-005-synthetic-demo-data.md, ADR-007-semantic-versioning.md, ADR-012-deployment-topology.md, ADR-017-interim-render-demo.md, ADR-018-render-marketing-static-site.md]
related_docs:
  [
    ../../workflows/feature-development.md,
    ../../workflows/release.md,
    ../../workflows/deploy-render.md,
    ../../roadmap/release-roadmap.md,
  ]
implementation:
  status: complete
validation:
  responsive: false
  accessibility: false
  tests_required: false
plane:
  work_item_id: f719d53e-a3bf-458d-9fca-934a132a76a5
  identifier: MEDCONNECT-131
---

# INFRA-018 — Render PR preview decision and delivery lanes

## Objective

Record which Render services get PR previews (ADR-019) and document how each kind of change moves
from task to demo, before any Blueprint change.

## Context

M18 and M19 deferred Render PR previews. ADR-018 forbids Render previews against the shared demo
database, and Render allows one Free Postgres per workspace. The workflow docs still describe
Amplify previews (INFRA-010), which are not live. Work is pushed straight to `main` today.

## Scope

Drafted when M20 was created (already in the repo):

- ADR-019 (status `Proposed`): marketing and web previews only, manual trigger, web previews in
  mock mode, API and database not previewed, `checksPass` deploy gate, paid upgrade path.
- `docs/workflows/delivery-lanes.md`: systems table, flow diagram, lanes (docs, marketing, web UI,
  API/data/security, infra/CI, full stack), what a mock preview does not prove, the Pencil →
  Figma → marketing example, and later options.

This task:

- Review both drafts against the repo, then set ADR-019 to `Accepted`.
- Point `feature-development.md` step 12, `release.md` steps 12–13, and the `deploy-render.md`
  M18 paragraph at the lanes doc and ADR-019. Keep the Amplify text as the M9 target.
- `docs/README.md` and ADR cross-links.

## Out of Scope

- `render.yaml`, `.github/**`, or application code (INFRA-019, INFRA-020, FE-048)
- A preview API or database
- Changing Plane sync or task conventions

## Requirements

- No claim that previews test live API behaviour.
- No HIPAA compliance claim. Synthetic data only.
- ADR-018 stays accepted; ADR-019 adds to it and does not supersede it.

## Acceptance criteria

- [x] ADR-019 is `Accepted`, is linked from ADR-018 consequences and `docs/README.md`, and names every
      Render service's preview status
- [x] `delivery-lanes.md` covers six lanes and states which lanes get which preview
- [x] `feature-development.md`, `release.md`, and `deploy-render.md` no longer imply a working
      Amplify preview on the current host
- [x] The release-roadmap Current position and M20 section mention this milestone

## Dependencies

- Blocked by: INFRA-015, INFRA-016 (shipped)
- Blocks: INFRA-019, INFRA-020, FE-048, QA-010

## Validation

Read ADR-019 against ADR-012, ADR-017, ADR-018 and the lanes doc for contradictions. Markdown
links resolve. `docs-sync-checker` passes.

## Risks / considerations

- Editing ADRs needs explicit approval (CLAUDE.md).
- The Mermaid diagram renders on GitHub; keep an ASCII summary out unless asked.

## Implementation notes

Docs only. No version bump or changelog entry (ADR-007).

## Completion

- Implementation: ADR-019 accepted (status note names INFRA-019/INFRA-020 as implementers); ADR-018
  consequences link ADR-019; `delivery-lanes.md` gained a status note for the not-yet-live parts;
  `feature-development.md` step 12, `release.md` steps 12-13 and the `deploy-render.md` M18
  paragraph point at the lanes doc and ADR-019 and keep Amplify as the M9 target; `docs/README.md`
  links ADR-018, ADR-019 and the lanes doc.
- Tests: none (docs only). Links checked with docs-sync-checker.
- PR: none yet.
- Notes: no version bump or changelog (ADR-007). `preview-status.yml` is still Amplify-only; INFRA-020
  updates it.
