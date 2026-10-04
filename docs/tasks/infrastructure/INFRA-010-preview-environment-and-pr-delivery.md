---
id: INFRA-010
type: task
area: infrastructure
feature: deployment
status: implemented
priority: high
estimate: 2
dependencies: [INFRA-005, INFRA-008, INFRA-009]
related_adrs: [ADR-005, ADR-012]
related_docs:
  [
    infrastructure-architecture.md,
    ../workflows/feature-development.md,
    ../roadmap/release-roadmap.md,
  ]
implementation:
  status: complete
validation:
  responsive: false
  accessibility: false
  tests_required: true
plane:
  work_item_id: 26e8f2bf-c459-45fd-bac5-12f24a2d929b
  identifier: MEDCONNECT-66
---

# INFRA-010 — Preview environment and PR delivery workflow

## Objective

Give every passing pull request an isolated Amplify preview that uses preview configuration
and the shared preview/demo API and database.

## Context

Why this task exists: interviewer and client review needs a URL that never uses production
secrets or production data.

Preview topology (locked in ADR-012 / INFRA-004): Amplify **PR/branch** frontend previews;
**one shared** preview ECS API and one preview/demo database. Per-PR ECS/RDS is out of scope.

Already present after earlier M9 tasks: CI quality gates, preview API, preview RDS, Amplify
app. This task wires the workflow and isolation checks.

## Scope

- Enable Amplify pull-request / branch previews.
- Preview Amplify environment variables point at the **preview** API only.
- Shared preview ECS and preview RDS already exist (INFRA-007 / INFRA-008); do not
  provision a new backend per PR.
- Document: frontend previews are PR-specific; API and database are shared (data may be
  overwritten by other PRs).
- CI failure: do not publish a preview.
- Preview deploy failure: the pull request stays unmerged; surface an Amplify status check
  or PR comment.
- CORS / origin allowlist includes preview hosts. Production browser origin talks only to
  the production API (production web must not be configured with preview credentials).

## Out of scope

- Ephemeral per-PR RDS or ECS
- Production deploys from feature branches
- Live Playwright against every preview
- OAuth callback registration per preview URL

## Requirements

- Preview is isolated from production: configuration, secrets, and database.
- Preview uses synthetic/demo data only. Never real PHI. Never production secrets.
- Suitable for interviewer and client demonstrations and review.
- Feature-branch / PR flow: feature branch → pull request → CI → preview → review.

## Technical constraints

- Follow ADR-012. Do not introduce a second preview topology.
- Prefer the Amplify-native PR preview feature over a custom frontend host per branch.
- Do not claim HIPAA compliance.

## Acceptance criteria

- [x] Opening a pull request produces or updates an Amplify preview URL after CI
- [x] Preview login uses preview/demo seed data only
- [x] Preview cannot use production Secrets Manager entries or production RDS
- [x] Documentation states that the preview API and database are shared
- [x] Feature branches cannot publish the production Amplify app

## Dependencies

- Blocked by: INFRA-005, INFRA-008, INFRA-009
- Related: INFRA-004 (env/CORS contract), INFRA-011 (production promotion after review)

## Validation

- Open a pull request, open the preview URL, sign in with preview demo credentials, and
  confirm the browser API host is the preview API.
- Confirm production Amplify env vars are unchanged.
- Confirm a failed CI run does not advertise a green preview.

## Documentation impact

- infrastructure-architecture preview section
- [feature-development.md](../../workflows/feature-development.md) and
  [release.md](../../workflows/release.md) mention of the preview URL
- release-roadmap shipped/pending split when this task ships

## Risks / considerations

- Shared preview data will collide across concurrent PRs. That is accepted. Document it
  instead of building per-PR databases.
- Amplify preview hostnames change per PR. CORS must use the INFRA-004 pattern, not a
  single hardcoded preview URL.
- Do not seed production identities into the preview database.

## Implementation notes

Suggested implementation order: after INFRA-005, INFRA-008, and INFRA-009.

Later shipping of this slice is a MINOR bump on 0.x. Writing the spec is not.

## Completion

- Implementation: Amplify-native PR previews against the shared preview ECS/RDS. Root
  [amplify.yml](../../../amplify.yml) writes `NEXT_PUBLIC_USE_MOCKS`,
  `NEXT_PUBLIC_API_BASE_URL`, and `API_BASE_URL` into `apps/web/.env.production` and fails
  closed if any is missing. [`.github/workflows/preview-status.yml`](../../../.github/workflows/preview-status.yml)
  posts the advertised preview URL only after quality CI succeeds (no AWS OIDC). Operator
  runbook: all-branch Amplify env = `preview_api_url`, `main` override = `production_api_url`,
  private GitHub repo, required `ci` check, keep `https://*.amplifyapp.com` on the preview
  API. Live Amplify Previews toggle and `AMPLIFY_APP_ID` remain operator steps
  ([deploy.md](../../workflows/deploy.md)).
- Tests: `scripts/ci/amplify-buildspec.spec.mjs` and `scripts/ci/preview-delivery.spec.mjs`
  (`npm run test:amplify-buildspec`, `npm run test:preview-delivery`). Quality CI runs both
  next to `test:ci-secrets`.
- PR:
- Notes: Version 0.57.0 → 0.58.0 (MINOR, hosted PR previews). ECS rolling deploy stays
  INFRA-011. Synthetic demo data only; never real PHI.
