---
id: INFRA-008
type: task
area: infrastructure
feature: deployment
status: pending
priority: high
estimate: 5
dependencies: [INFRA-006, INFRA-007, BE-001]
related_adrs: [ADR-001, ADR-005, ADR-012]
related_docs:
  [
    infrastructure-architecture.md,
    backend-architecture.md,
    ../roadmap/release-roadmap.md,
  ]
implementation:
  status: not_started
validation:
  responsive: false
  accessibility: false
  tests_required: true
plane:
  work_item_id: null
  identifier: null
---

# INFRA-008 — NestJS API container and ECS/Fargate deployment

## Objective

Build and run `apps/api` as a container on ECS Fargate in preview and production, with secret
injection, networking, health checks, CORS, HTTPS, and persistent document storage.

## Context

Why this task exists: architecture already chose ECS/Fargate for the API. There is no
Dockerfile and no hosted API. Amplify (INFRA-009) needs a stable HTTPS API URL.

Already present: `npm run build:api` / `start:prod`, `GET /health` and `GET /ready`,
single-origin CORS via `WEB_ORIGIN`, local filesystem document adapter.

## Scope

- Add `apps/api/Dockerfile` and a root or API `.dockerignore` (no `.env`, no document blobs,
  no AWS keys, no `node_modules`).
- ECR, ECS service, HTTPS public URL (ALB with ACM on an operator domain, or CloudFront in
  front of the ALB if no domain is supplied), task IAM role.
- Inject secrets from Secrets Manager. Set `APP_ENV`, `WEB_ORIGIN` / `WEB_ORIGINS`, `PORT`,
  and `SWAGGER_UI_ENABLED=false` in production.
- ALB (or equivalent) liveness on `/health`, readiness on `/ready`.
- Implement the INFRA-004 CORS origin list or preview-host pattern so Amplify PR URLs can
  call the **preview** API only.
- S3 document adapter for preview and production using the existing key prefix
  `practices/{practiceId}/patients/{patientId}/{documentId}`. Local filesystem adapter stays
  for local `APP_ENV`.
- One service per environment (preview vs production). No microservices split.
- Basic CloudWatch logs on the task. No APM suite.
- CI: build the image on pull requests; push on `main` / preview deploy (push wiring may
  complete in INFRA-010 / INFRA-011).

## Out of scope

- Kubernetes / EKS
- Redis, SNS/SQS
- Enabling Swagger UI in production
- Cookie-session or OAuth rewrite
- Hosting Next.js on ECS (Amplify is INFRA-009)
- Per-PR ECS services

## Requirements

- Preview and production APIs are isolated: distinct cluster services, secrets, and
  databases.
- Runtime uses `medconnect_app`. RLS still applies.
- Frontend origin for that environment can authenticate with the existing opaque bearer
  login.
- Documents persist across task replacement in hosted environments.
- Production API cannot use preview secrets or the preview database.
- Synthetic demo data only. Never introduce real PHI.

## Technical constraints

- Follow [ADR-001](../../decisions/ADR-001-modular-backend.md) and ADR-012 (from INFRA-004).
- Do not embed secrets in the image.
- HTTPS is required on the public API URL.
- Custom domain is optional. Default is an AWS-provided HTTPS hostname.
- Do not introduce unnecessary dependencies.
- Do not claim HIPAA compliance.

## Acceptance criteria

- [ ] The API image builds in CI (build-only on PR; push on `main` / preview deploy)
- [ ] Preview and production APIs respond on `/health` and `/ready` over HTTPS
- [ ] Runtime uses `medconnect_app`; RLS still applies
- [ ] The environment’s frontend origin can sign in with the existing bearer login
- [ ] Documents persist across task replacement in hosted environments
- [ ] Production API cannot use preview secrets or the preview database
- [ ] Task definition references secrets; it does not inline plaintext passwords

## Dependencies

- Blocked by: INFRA-006, INFRA-007, BE-001
- Related: INFRA-009 (consumes the API URL), INFRA-010, INFRA-011
- CORS contract: INFRA-004

## Validation

- `curl` `/health` and `/ready` on both hosted APIs over HTTPS.
- Login + one authorized domain GET (for example patients or health-adjacent admin) with a
  seeded demo user.
- Upload and download a synthetic document; replace the task and confirm the object remains.
- Inspect the task definition: secret refs, not plaintext env.

## Documentation impact

- infrastructure-architecture runtime (ECS/Fargate, HTTPS, health)
- backend-architecture hosted note
- release-roadmap shipped/pending split when this task ships

## Risks / considerations

- ACM public certificates need a domain. If none is supplied, terminate TLS on CloudFront’s
  default domain in front of the ALB. Do not ship a plaintext public API.
- Fargate ephemeral disk makes the local document adapter unsuitable for hosted envs.
- Current CORS is a single origin. Preview Amplify URLs will fail until the INFRA-004
  contract is implemented here.
- Do not put `@aws-sdk` clients into the web bundle.

## Implementation notes

Suggested implementation order: after INFRA-007. Scaffold Amplify (INFRA-009) in parallel;
wire production `NEXT_PUBLIC_API_BASE_URL` after this API URL exists.

Later shipping of this slice is a MINOR bump on 0.x. Writing the spec is not.

## Completion

- Implementation:
- Tests:
- PR:
- Notes: Pending M9 implementation.
