---
id: INFRA-020
type: task
area: infrastructure
feature: deployment
status: pending
priority: medium
estimate: 2
dependencies: [INFRA-018, QA-011, SEC-010]
related_adrs: [ADR-007-semantic-versioning.md, ADR-017-interim-render-demo.md]
related_docs:
  [
    ../../workflows/delivery-lanes.md,
    ../../workflows/release.md,
    ../../workflows/deploy-render.md,
  ]
implementation:
  status: not_started
validation:
  responsive: false
  accessibility: false
  tests_required: true
plane:
  work_item_id: 775d791f-5796-4ae4-bd45-f11f675ca146
  identifier: MEDCONNECT-133
---

# INFRA-020 — Checks-gated deploys and PR workflow

## Objective

Make `main` deploy only after CI passes, make PRs the only way into `main`, and replace the
Amplify-only PR comment with one that matches the active host.

## Context

`render.yaml` sets no `autoDeployTrigger`, so Render deploys every commit to `main`, including a
red one. `.github/workflows/preview-status.yml` posts an Amplify preview comment on every PR; with
`AMPLIFY_APP_ID` unset it tells the reviewer to set an Amplify variable, which does not apply to
the Render demo. Work currently lands by direct push.

## Scope

- `render.yaml`: `autoDeployTrigger: checksPass` on `medconnect-api`, `medconnect-web`, and
  `medconnect-marketing`.
- `preview-status.yml`: when `AMPLIFY_APP_ID` is unset, post a Render comment instead (CI result,
  how to request a preview with the `render-preview` label, that web previews use mock data, link
  to `delivery-lanes.md`). Keep the Amplify branch for M9. Update
  `scripts/ci/preview-delivery.spec.mjs` to match.
- `.github/pull_request_template.md`: task ID, Plane identifier, lane, preview needed, ADR-007
  impact, docs/changelog checklist.
- Operator step, recorded in Completion: branch protection on `main` requiring the `ci` check,
  no direct pushes (via `gh api` or GitHub settings).

## Out of Scope

- Path-filtered or split CI jobs (docs fast lane is later)
- GitHub Issues or a Plane–GitHub integration
- Render preview settings (INFRA-019)

## Requirements

- Ask before editing `.github/**` (CLAUDE.md).
- The required check name must match the job Render waits for (`ci`).
- The comment must not imply a live-API preview.

## Acceptance criteria

- [ ] A commit to `main` with failing `ci` does not deploy any Render service
- [ ] A commit to `main` with passing `ci` deploys only the services its build filters match
- [ ] A PR shows one project comment that matches the Render setup when `AMPLIFY_APP_ID` is unset
- [ ] `npm run test:preview-delivery` passes with the updated workflow
- [ ] New PRs open with the template
- [ ] `main` rejects direct pushes and requires `ci`; Completion records the `gh` output

## Dependencies

- Blocked by: INFRA-018, QA-011, SEC-010 (a red `ci` on `main` would stop all `checksPass` deploys)
- Related: INFRA-019, INFRA-010 (Amplify branch of the comment)

## Validation

Push a deliberately failing commit to a throwaway branch protected like `main`, or watch the Render
deploy history after a red and a green `main` run. Open a test PR to see the comment and template.

## Risks / considerations

- With branch protection on, an urgent fix also needs a PR; admins can still bypass, which should
  be rare and noted.
- `checksPass` waits for all checks on the commit. If another check is added later and fails,
  deploys stop too.

## Implementation notes

Delivery workflow change, no product surface: PATCH bump and changelog entry, or fold into
INFRA-019's MINOR if they ship together.

## Completion

- Implementation:
- Tests:
- PR:
- Notes:
