---
id: INFRA-019
type: task
area: infrastructure
feature: deployment
status: pending
priority: high
estimate: 3
dependencies: [INFRA-018]
related_adrs: [ADR-005-synthetic-demo-data.md, ADR-007-semantic-versioning.md, ADR-017-interim-render-demo.md, ADR-018-render-marketing-static-site.md]
related_docs:
  [
    ../../workflows/deploy-render.md,
    ../../workflows/delivery-lanes.md,
    ../../contracts/environment-configuration.md,
    ../../../render.yaml,
  ]
implementation:
  status: not_started
validation:
  responsive: false
  accessibility: false
  tests_required: true
plane:
  work_item_id: a1175760-f864-4dcd-94ff-9a3c4f7a1433
  identifier: MEDCONNECT-132
---

# INFRA-019 — Render frontend service previews (marketing + web in mock mode)

## Objective

Enable manual Render service previews for `medconnect-marketing` and `medconnect-web`, with web
previews built in mock mode and unable to reach the interviewer API or database.

## Context

ADR-019. Today `medconnect-web` gets `API_BASE_URL` from `medconnect-api` via `fromService`. A
preview copies the base service's env, so without a change a web preview would proxy
`/mcp-api` to the interviewer API and write into the demo database. `build:mocks` and the mock
layer already exist (`apps/web/package.json`, `apps/web/src/lib/api/mocks/runtime.ts`).

## Scope

- `render.yaml`: `previews.generation: manual` on `medconnect-marketing` and `medconnect-web`.
  No `previews` on `medconnect-api`; no root-level `previews` (preview environments stay off).
- Web build: when `IS_PULL_REQUEST=true`, build with `NEXT_PUBLIC_USE_MOCKS=true`,
  `NEXT_PUBLIC_MOCK_ERROR_RATE=0`, a short mock delay, and `NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS=true`;
  otherwise `build:production` as today. Keep the branching in one committed script or command,
  not in application code.
- Web start: when `IS_PULL_REQUEST=true`, start without `API_BASE_URL` so `/mcp-api` returns 503.
- Marketing previews: same build; sign-in links keep pointing at the demo app origin.
- A Node test (like `scripts/ci/amplify-buildspec.spec.mjs`) that fails if the API gets previews,
  if root `previews` is enabled, or if the web preview path can build with mocks off. Wire it into
  `ci.yml` next to `test:preview-delivery` (ask before editing `.github/`).
- Update `deploy-render.md` (how to request a preview, what it costs, free-hours note) and
  `environment-configuration.md` (preview rows for `IS_PULL_REQUEST` mapping).

## Out of Scope

- A preview API or preview database (paid upgrade, later ADR)
- Preview banner UI (FE-048)
- Deploy gating and PR comment (INFRA-020)
- Changing the interviewer services' production env

## Requirements

- Previews never receive `DATABASE_*`, `APP_ROLE_PASSWORD`, `RATE_LIMIT_KEY_SECRET`, or any
  API secret. The web service holds none today; keep it that way.
- Application code reads only provider-neutral variables. `IS_PULL_REQUEST` appears only in
  Render build/start config.
- Fail closed: if the preview cannot tell it is a preview, it must not build in live mode against
  the demo API. Confirm `IS_PULL_REQUEST` is present at build time on the first real preview.

## Acceptance criteria

- [ ] A PR labelled `render-preview` that touches `apps/marketing/**` gets a working marketing
      preview URL; without the label it gets none
- [ ] A labelled PR that touches `apps/web/**` gets a web preview where sign-in with a demo
      account works on mock data
- [ ] On the web preview, a request to `/mcp-api/health` returns 503, and the API logs show no
      requests from the preview
- [ ] `medconnect-api` and `medconnect-postgres` get no preview instance
- [ ] Previews are removed when the PR closes or merges
- [ ] The new spec test runs in CI and fails on the forbidden configurations above
- [ ] `deploy-render.md` and `environment-configuration.md` describe the preview behaviour

## Dependencies

- Blocked by: INFRA-018
- Related: INFRA-020 (gate and comment), FE-048 (banner), QA-010 (pilot)

## Validation

Open one draft PR per lane with the label. Check the build log for mock mode, the preview's
`/mcp-api/health`, the API service logs, and the Render dashboard instance list. Run the new spec
test locally.

## Risks / considerations

- Free web previews share the workspace's 750 free instance hours with the demo. Manual trigger
  and auto-delete keep this small. Watch hours during the pilot.
- Free web previews spin down like the demo; first load takes about a minute.
- Build filters also gate preview builds. A docs-only PR will not rebuild a preview.
- `fromService` values are copied into the preview at creation; the start-time unset is the
  control, not the Blueprint value.

## Implementation notes

New hosted capability for reviewers: MINOR bump on 0.x, changelog entry (INFRA-010 precedent).

## Completion

- Implementation:
- Tests:
- PR:
- Notes:
