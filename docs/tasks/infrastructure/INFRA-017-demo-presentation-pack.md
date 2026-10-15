---
id: INFRA-017
type: task
area: infrastructure
feature: deployment
status: pending
priority: medium
estimate: 3
dependencies: [FE-037, FE-038, FE-039, INFRA-015, INFRA-016]
related_adrs: [ADR-005-synthetic-demo-data.md, ADR-007-semantic-versioning.md, ADR-017-interim-render-demo.md, ADR-018-render-marketing-static-site.md]
related_docs:
  [
    ../../workflows/deploy-render.md,
    ../../workflows/versioning.md,
    ../../marketing/capability-matrix.md,
    ../../roadmap/release-roadmap.md,
    ../../roadmap/post-mvp-baseline.md,
    ../../../README.md,
  ]
implementation:
  status: not_started
validation:
  responsive: false
  accessibility: true
  tests_required: false
plane:
  work_item_id: dc96ef7b-9eac-4793-9efc-d9394166ff6f
  identifier: MEDCONNECT-115
---

# INFRA-017 — Demo presentation pack

## Objective

Make the repository and GitHub presentation match the verified Render demo, after the M18
sign-in and telehealth tasks have shipped.

## Context

README still says the runnable demo is local and that there is no public hosted URL. The
runbook already documents `https://medconnectpro.app`, the marketing host, and the API.
Screenshots under `apps/web/public/marketing/` were not recaptured after the current login
panel. This task does not close M9.

## Scope

After FE-037, FE-038, and FE-039:

- README: live links for the app, marketing site, and API health; the four demo accounts; MFA
  code; known limits
- Replace README screenshots from the current app, without obsolete debug controls
- Known limits to state in plain language: free web sleep, Postgres expiry 2026-11-13,
  ephemeral local documents, Daily only when the operator has set `DAILY_API_KEY`, OAuth not
  configured on the public demo, synthetic data only, not HIPAA certified
- Operator updates GitHub About and topics with `gh` so they match that README
- Changelog entry and a demo/pre-release note for the deployed commit that was verified
- Do not publish secrets, real patient data, or filled env files

## Out of Scope

- Changing Render plans, domains, or creating preview services
- Tagging `1.0.0` or closing M9, INFRA-013, or INFRA-014
- New product behavior
- Setting `DAILY_API_KEY` (operator choice, outside Git)

## Requirements

- Public claims stay inside [capability-matrix.md](../../marketing/capability-matrix.md).
- Demo passwords in the README are the existing synthetic fixtures only.
- Screenshots show synthetic data only.

## Acceptance criteria

- [ ] README links `https://medconnectpro.app`, the marketing host, and API `/health`
- [ ] README lists the four demo accounts, the MFA code, and the limits in Scope
- [ ] README no longer says there is no public hosted URL
- [ ] Screenshots match the current sign-in and app, and do not show development-only controls
- [ ] GitHub About and topics match the README and do not claim HIPAA compliance or working OAuth
- [ ] Changelog and a demo/pre-release note name the verified deployed commit
- [ ] No secret, database URL, or real PHI is added

## Dependencies

- Blocked by: FE-037, FE-038, FE-039, INFRA-015, INFRA-016
- Related: QA-006 (baseline), QA-007 (close). Presentation may land before the close audit;
  the close audit re-checks the deployed commit named here.

## Validation

Read the README against the capability matrix. Open the screenshot files. `gh repo view` for
About and topics after the operator edit. Update the release-roadmap crosswalk for INFRA-017.

## Risks / considerations

- Screenshot capture can include the demo passwords. That is intentional and matches the public
  login panel. Do not capture a Daily token, cookie, or env screen.
- GitHub About is not a file in this repo. Record the `gh` result in Completion.

## Implementation notes

Version bump follows the highest M18 change already shipped in the same release. This pack alone,
if it only documents existing behavior, is not a product bump; if it ships with the MINOR
features, one MINOR covers the release. Do not tag unless the user asks.

## Completion

- Implementation:
- Tests:
- PR:
- Notes: Not started.
