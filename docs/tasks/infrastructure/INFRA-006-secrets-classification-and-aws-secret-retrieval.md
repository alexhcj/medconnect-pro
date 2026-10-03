---
id: INFRA-006
type: task
area: infrastructure
feature: deployment
status: pending
priority: high
estimate: 2
dependencies: [INFRA-004]
related_adrs: [ADR-005, ADR-012]
related_docs:
  [
    security-architecture.md,
    infrastructure-architecture.md,
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

# INFRA-006 — Secrets classification and AWS secret retrieval

## Objective

Keep secrets out of Git, images, and public configuration. Retrieve preview and production
runtime secrets from AWS Secrets Manager, and use Systems Manager Parameter Store only when it
is simpler than extra secret entries.

## Context

Why this task exists: security architecture already names Secrets Manager / Parameter Store;
no SDK, IAM retrieval, or hosted secret containers exist. Local Compose passwords must not
become hosted credentials.

Already present: `.gitignore` for `.env*`, env-var loading, documented “do not commit secrets.”

## Scope

- Finish the audit table: database credentials, any future session-signing secret, AWS access
  via GitHub OIDC (not long-lived access keys), document-bucket access via the ECS task role,
  Plane API keys (developer tooling only — not application runtime).
- Smallest Terraform (or bootstrap) that creates distinct preview and production secret
  containers.
- ECS tasks retrieve secrets at runtime. Values are never baked into the image or into Amplify
  `NEXT_PUBLIC_*`.
- GitHub does not store database passwords as plaintext when OIDC + Secrets Manager can supply
  them. Amplify environment is non-secret frontend configuration only.
- Document rotation/replacement at runbook level. Do not build an enterprise secret platform.

## Out of scope

- HashiCorp Vault
- Custom KMS key hierarchy
- Encrypting frontend bundles
- Inventory of OAuth client secrets or payment keys that do not exist
- Implementing the API Dockerfile (INFRA-008) beyond the rule that images must not contain
  secrets

## Requirements

- Classification: public / environment-specific / secret, consistent with INFRA-004.
- Preview and production secret names are distinct. No reuse of local Compose passwords.
- Secrets never belong in Git history, committed `.env` files, source hardcoding, Docker
  images, or public configuration.
- Synthetic demo data only. Never introduce real PHI.

## Technical constraints

- Prefer Secrets Manager for runtime secrets (`DATABASE_URL`, `DATABASE_ADMIN_URL`, and any
  later signing material).
- Parameter Store only for non-secret environment configuration if that stays simpler.
- GitHub Actions authenticates to AWS with OIDC.
- Do not introduce unnecessary dependencies or a second secret store.
- Do not claim HIPAA compliance.

## Acceptance criteria

- [ ] Classification documentation exists for public / environment-specific / secret
- [ ] Preview and production secret names are distinct
- [ ] A grep/CI guard or documented check exists so `.env` files, default Compose URLs, and
      AWS access keys are not committed
- [ ] The planned API image contract has no secret `ENV` / `ARG` values
- [ ] Amplify / `NEXT_PUBLIC_*` is documented as public configuration only

## Dependencies

- Blocked by: INFRA-004
- Related: INFRA-007, INFRA-008, SEC-001, ADR-005
- Unblocks: INFRA-007 (RDS credentials), INFRA-008 (task injection)

## Validation

- Inspect Terraform (or bootstrap) for secret resources and IAM read policies.
- Confirm example files still contain placeholders only.
- Confirm no long-lived AWS access keys are added to GitHub secrets for this purpose.

## Documentation impact

- security-architecture secrets section
- infrastructure-architecture
- INFRA-004 environment catalog (extend, do not fork)
- Short rotation note in the deploy runbook (create or update; do not duplicate)

## Risks / considerations

- Do not copy Compose `medconnect` / `medconnect_app` passwords into Secrets Manager as the
  hosted values.
- Plane `PLANE_API_KEY` is optional sync tooling. It is not an application runtime secret and
  must not be injected into ECS or Amplify.
- The API image does not exist yet. This task defines the injection contract; INFRA-008
  implements the Dockerfile and task definition.

## Implementation notes

Suggested implementation order: after INFRA-004, before INFRA-007 and INFRA-008.

Operator prerequisite: an AWS account and permission to create secrets and an OIDC provider.
That is not a product fork.

Later shipping of this slice is a MINOR bump on 0.x. Writing the spec is not.

## Completion

- Implementation:
- Tests:
- PR:
- Notes: Pending M9 implementation.
