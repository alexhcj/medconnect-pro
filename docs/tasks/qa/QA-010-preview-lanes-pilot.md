---
id: QA-010
type: task
area: qa
feature: deployment
status: pending
priority: medium
estimate: 1
dependencies: [INFRA-019, INFRA-020]
related_adrs: [ADR-005-synthetic-demo-data.md]
related_docs:
  [
    ../../workflows/delivery-lanes.md,
    ../../workflows/deploy-render.md,
  ]
implementation:
  status: not_started
validation:
  responsive: false
  accessibility: false
  tests_required: false
plane:
  work_item_id: c1af3f26-8611-4ec5-a6c1-48c1dda4ab65
  identifier: MEDCONNECT-135
---

# QA-010 — Preview lanes pilot

## Objective

Run one real PR through each lane and record evidence that previews work and stay isolated from
the interviewer demo.

## Scope

Three small PRs (real fixes from `info.md` where possible):

1. Docs lane: a docs-only change. Expect `ci`, no preview.
2. Marketing lane: a marketing change with the `render-preview` label. Expect a static preview.
3. Web lane: an `apps/web` change with the label. Expect a mock-mode web preview.

For each: preview URL (or none), `ci` result, merge, `main` deploy after `ci`, smoke of the
changed surface.

## Out of Scope

- Load or cost testing; live-API preview (not built)

## Acceptance criteria

- [ ] Each lane behaves as `delivery-lanes.md` says
- [ ] Web preview: demo-account sign-in works on mocks; `/mcp-api/health` returns 503
- [ ] Interviewer API logs show no requests from preview hosts during the pilot
- [ ] Free instance hours used by previews during the pilot are recorded
- [ ] Any mismatch becomes a doc fix or a new task, listed in Completion

## Dependencies

- Blocked by: INFRA-019, INFRA-020. FE-048 is optional.

## Validation

PR links, Render deploy history, and API log excerpts (no secrets) in Completion.

## Implementation notes

Test and docs only. No version bump.

## Completion

- Implementation:
- Tests:
- PR:
- Notes:
