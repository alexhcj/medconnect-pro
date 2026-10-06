---
id: SEC-005
type: task
area: security
feature: compliance
status: pending
priority: medium
estimate: 2
dependencies: [BE-014, FE-027, FE-028, BE-015, FE-029]
related_adrs: [ADR-003-authentication.md]
related_docs:
  [
    ../../architecture/security-architecture.md,
    ../../contracts/identity-and-access.md,
    ../../product/security.md,
    ../../product/identity-access.md,
    ../../roadmap/post-mvp-baseline.md,
    ../../releases/github-release-notes-template.md,
    ../../00-project-spec.md,
  ]
implementation:
  status: not_started
validation:
  responsive: false
  accessibility: false
  tests_required: false
plane:
  work_item_id: null
  identifier: null
---

# SEC-005 — Production-gap documentation

## Objective

Document the remaining production and HIPAA-oriented gap after M11 ships: demo cookies, mock
MFA, and security-events are demonstrated patterns, not production OAuth, production MFA, or
HIPAA certification.

## Context

M11’s release-roadmap sentence includes production-gap documentation. Architecture, identity
contract, and [product/security.md](../../product/security.md) already describe patterns and
claim limits. There is no `docs/security/` or `docs/compliance/` index that an interviewer can
open as the explicit gap. This task **links** those sources; it must not duplicate RBAC, RLS,
or permission catalogs.

Last M11 task so the prose matches shipped cookies, mock MFA UI, and security-events.

## Scope

Add a small `/docs` set:

- `docs/security/README.md` — index
- `docs/security/authentication-and-session.md` — mock IdP + cookies vs OIDC+PKCE; mock MFA vs
  production MFA
- `docs/compliance/hipaa-readiness.md` — implemented patterns vs not certified (existing
  project disclaimer language)
- `docs/compliance/production-requirements.md` — remaining production list (OAuth, hosted MFA,
  rate limits, organizational BAAs/policies, monitoring, M9 hosting, and so on)

Update, when this ships:

- [post-mvp-baseline.md](../../roadmap/post-mvp-baseline.md) “Intentionally incomplete”: drop
  “security-events HTTP” as a remaining gap and point at these files
- [github-release-notes-template.md](../../releases/github-release-notes-template.md)
  known-limitations line that still says security-events HTTP is not shipped
- README / AGENTS current-position if they still describe M11 as remaining

## Out of Scope

- Claiming HIPAA compliance, certification, or suitability for real patient data
- Inventing vendor BAAs or a full compliance program
- Duplicating the permission catalog, RLS policies, or deploy runbook
- AWS operator apply (INFRA-014 / deploy.md already exist)
- Application code, version bump

## Requirements

- Use the project’s existing disclaimer: healthcare-oriented / HIPAA-oriented **patterns**,
  not a certified production system
- Point to ADR-003, identity-and-access.md, security-architecture.md, and docs/product/
- Keep files short
- Do not treat `info.md` as source of truth

## Acceptance Criteria

- [ ] The four files exist and state the demo is not HIPAA certified and not production OAuth
- [ ] They describe M11 cookies, mock MFA, and security-events as demo surfaces
- [ ] post-mvp-baseline “Intentionally incomplete” no longer lists security-events HTTP as
      unshipped; it points at the new docs
- [ ] GitHub 1.0.0 notes template known limitations match that state
- [ ] README / AGENTS current position no longer calls M11 task IDs remaining after close

## Dependencies

- BE-014, FE-027, FE-028, BE-015, FE-029 (so claims match shipped M11)
- Drafting may start in parallel; merge last

## Validation

- Documentation review only
- No version bump (docs that do not ship a product change)

## Risks / Considerations

- Over-documenting implementation details creates drift. Link, do not copy, contracts.
- Public marketing copy still must not exceed the capability matrix.

## Implementation notes

Suggested order: last M11 task.

Writing this spec is not a version bump. Completing this task is not a version bump.

## Completion

- Implementation:
- Tests:
- PR:
- Notes:
