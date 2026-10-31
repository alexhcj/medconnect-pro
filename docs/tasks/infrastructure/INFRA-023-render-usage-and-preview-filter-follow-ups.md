---
id: INFRA-023
type: task
area: infrastructure
feature: deployment
status: pending
priority: low
estimate: 1
dependencies: [QA-010]
related_adrs: [ADR-017-interim-render-demo.md, ADR-019-render-pr-previews.md]
related_docs:
  [
    ../../workflows/deploy-render.md,
    ../../workflows/delivery-lanes.md,
    ../qa/QA-010-preview-lanes-pilot.md,
  ]
implementation:
  status: not_started
validation:
  responsive: false
  accessibility: false
  tests_required: true
plane:
  work_item_id: c98c5504-96af-4d12-8a48-5121ef865850
  identifier: MEDCONNECT-157
---

# INFRA-023 — Render usage and preview build-filter follow-ups

## Objective

Resolve the mismatches the QA-010 preview lanes pilot found, so `deploy-render.md` and
`delivery-lanes.md` describe what Render actually builds and bills.

## Context

QA-010 (shipped 2026-10-31) ran one real PR per lane. Its Completion lists four mismatches that
need a decision, not a quick doc edit:

1. The Render billing page lists 292.45 free instance hours each for `medconnect-api` and
   `medconnect-web`, above the 253.37 hours shown for the whole workspace on the same day. The pilot
   recorded preview hours only as an upper bound (about 5.0 h, from preview lifetimes), because the
   Render API does not expose instance hours.
2. The workspace has 4 custom domains against 2 included. `deploy-render.md` prices extra names at
   about $0.25 per month each, yet the runbook, M20 and ADR-019 text say "no paid resources".
3. A marketing-lane PR that bumps the root version also builds a web preview: `package.json` and
   `package-lock.json` are in the build filters of both `medconnect-marketing` and
   `medconnect-web` (PR #9 built `medconnect-web-pr-9`). `delivery-lanes.md` lists only the
   marketing static site for that lane.
4. Preview-to-preview links (web preview to marketing preview) are not wired. Service previews copy
   base settings at creation, and Render does not document `fromService` across previews.

## Scope

- Read the Render billing and usage pages and explain the hours figures (wall clock vs billed, per
  service vs workspace). Record the explanation and the preview-hours difference against the QA-010
  baseline in `deploy-render.md`.
- Check the billing page for a custom-domain charge. Then either change the "no paid resources"
  wording in `deploy-render.md` (and the M20 text in the roadmap) to name the domain charge, or
  record that no charge applies.
- Decide how the lane table handles a root version bump: either document that a version bump in a
  marketing-lane PR also builds a web preview, or propose a `render.yaml` build-filter change. A
  `render.yaml` change is an Infra / CI lane change: ask before editing it.
- Record preview-to-preview links as a known limitation in `deploy-render.md` "PR previews".

## Out of Scope

- Moving to a paid plan, adding a preview API or database, or AWS work.
- Changing which services get previews (ADR-019).

## Requirements

- No secrets, billing account details or invoices in `/docs`; record only usage figures.
- A `render.yaml` filter change, if chosen, keeps `npm run test:render-previews` green and updates
  its spec.

## Acceptance Criteria

- [ ] `deploy-render.md` explains the free instance hours figures and records the pilot's preview
  hours against the QA-010 baseline.
- [ ] The custom-domain cost is stated correctly wherever the docs say "no paid resources".
- [ ] `delivery-lanes.md` (or `render.yaml` plus its spec) matches what a marketing-lane PR with a
  version bump builds.
- [ ] Preview-to-preview links are listed as a known limitation.

## Dependencies

- Follows QA-010 (shipped). Does not block INFRA-021 (1.0.0): none of these claims is on the
  marketing site.

## Validation

`npm run test:render-previews` if `render.yaml` changes; `npm run docs:marketing-sync`; owner
reading of the Render billing page recorded in Completion.

## Risks / Considerations

- The hours figures come from the dashboard only; record the date and the page used.
- Narrowing the web build filter could skip a web deploy that a root dependency change needs.

## Versioning

Docs only: no version bump. A `render.yaml` change is an infra change: bump per ADR-007 then.

## Roadmap

Standalone (no milestone). Logged by the QA-010 close on 2026-10-31. Can run before or after the
1.0.0 demo release.
