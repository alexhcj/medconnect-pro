---
id: SEC-009
type: task
area: security
feature: security
status: implemented
priority: high
estimate: 2
dependencies: [SEC-008, BE-021, FE-035]
related_adrs: [ADR-002-tenant-isolation.md, ADR-003-authentication.md, ADR-015-rate-limiting-and-api-protection.md, ADR-016-super-admin-session-tenant-scope.md]
related_docs:
  [
    ../../architecture/security-architecture.md,
    ../../architecture/data-architecture.md,
    ../../contracts/identity-and-access.md,
    ../../contracts/api-endpoints.md,
    ../../contracts/data-contracts.md,
    ../../compliance/hipaa-readiness.md,
    ../../compliance/production-requirements.md,
    ../../security/README.md,
    ../../product/identity-access.md,
    ../../roadmap/release-roadmap.md,
  ]
implementation:
  status: complete
validation:
  responsive: false
  accessibility: false
  tests_required: false
plane:
  work_item_id: ffa77236-c23e-4635-9b05-be5f53f57b64
  identifier: MEDCONNECT-103
---

# SEC-009 — M17 security findings, ADR-016, and contract reconciliation

## Objective

Record the M17 security and compliance decisions before code: SUPER_ADMIN session-tenant scope
(ADR-016), PROVIDER billing alignment, clinical read-audit actions, concurrent-session inventory
without IP/geo leakage, demo retention policy, and explicitly deferred risks. Docs only.

## Context

M11–M16 shipped cookies/MFA/security-events, OAuth/PKCE, rate limits, and live-telehealth access.
[identity-and-access.md](../../contracts/identity-and-access.md) still says `SUPER_ADMIN` may act
across practices, while later HTTP (BE-010, BE-013, SEC-003, BE-015) is session-membership scoped.
Default-grants text limits PROVIDER billing to “care-relevant” work; BE-007 mapping and
`billing-access.ts` are practice-wide. Clinical list GETs are not audited despite the architecture
“patient record access” rule. Concurrent sessions are detectable in the identity contract, but live
`checkConcurrentSessions` returns `[]` (FE-027 deferred list HTTP). Product and data-architecture
mention retention without an RTBF API; OpenAPI forbids `DELETE /patients/{id}`.

M17 is **Security and Compliance Maturity**. Implementation tasks are
[BE-022](../backend/BE-022-clinical-record-read-audit.md),
[BE-023](../backend/BE-023-concurrent-session-inventory-http.md),
[FE-036](../frontend/FE-036-live-concurrent-session-chrome.md), and
[QA-005](../qa/QA-005-authorization-and-tenant-regression-expansion.md).

## Scope

- `docs/decisions/ADR-016-super-admin-session-tenant-scope.md`: demo HTTP stays session-membership
  scoped for `SUPER_ADMIN`. Cross-practice operation requires a future server-derived
  practice-select API, never a client-supplied `practiceId`. Missing cross-practice HTTP is not an
  IDOR.
- [identity-and-access.md](../../contracts/identity-and-access.md):
  - Align the SUPER_ADMIN tenant-resolution bullets with ADR-016 and existing session-tenant HTTP.
  - Align PROVIDER `read:billing` on this surface with BE-007 (practice-wide invoice/claims list is
    practice revenue administration, not a care-team resource check).
  - Specify clinical read-audit actions: `history.listed`, `condition.listed`, `vital.listed`,
    `medication.listed`; resource type/id = patient; no PHI/payload.
  - Specify `GET /auth/sessions` and `POST /auth/sessions/:id/revoke`: `sessionId`, `createdAt`,
    `lastActivityAt`, `isCurrent`, optional coarse device class; **no raw IP, location, or
    user-agent string**. Revoke-other keeps the current session; revoke-current equals logout.
    Keep `POST /auth/logout-all`.
- [ADR-015](../../decisions/ADR-015-rate-limiting-and-api-protection.md) additive policy rows only
  (do not replace the limiter): session-user, fail-open limits on `GET /auth/sessions` and
  `POST /auth/sessions/:id/revoke`.
- [api-endpoints.md](../../contracts/api-endpoints.md): the two session-inventory routes.
- [security-architecture.md](../../architecture/security-architecture.md) and
  [data-architecture.md](../../architecture/data-architecture.md): clinical list reads in the
  audit list; session inventory without IP/geo; SUPER_ADMIN session-tenant pointer to ADR-016.
- Demo retention / deletion policy in [hipaa-readiness.md](../../compliance/hipaa-readiness.md)
  and [production-requirements.md](../../compliance/production-requirements.md): synthetic data,
  seed reset, no RTBF HTTP, no patient DELETE. Record deferred risks (OAuth unlink, Zod `.strict()`
  on remaining write schemas, role-assignment rate limit, payment idempotency, CI SAST, patient-list
  / billing GET audit, Playwright role matrix, idle keep-alive).
- [identity-access.md](../../product/identity-access.md): `identity-access.concurrent-sessions`
  remains `planned` until FE-036 ships. Do not raise marketing claims in this task.
- Catalog `security.hipaa-certification` stays `out_of_scope`.

## Out of Scope

- Any application code, migration, or dependency change
- Implementing SUPER_ADMIN cross-practice HTTP or a practice switcher
- Changing PROVIDER billing to care-team-only
- Patient DELETE / RTBF API
- AWS / INFRA-014, Redis, WAF, production MFA, HIPAA certification
- Chat, recording, Socket.IO, hosted Stripe

## Requirements

- Prefer the more specific shipped HTTP mapping over older grant prose when they conflict.
- Session inventory must not become an IP or location oracle.
- Do not claim HIPAA compliance, production security, or infrastructure controls that are not
  verified.
- Docs-only: no version bump (ADR-007).

## Acceptance Criteria

- [x] ADR-016 accepted with alternatives (implement cross-practice switcher now; leave the
      identity-contract “all practices” sentence unmodified) and consequences
- [x] Identity, API, security, and data-architecture docs match shipped HTTP plus M17 intent
- [x] Clinical read-audit action names and no-PHI rule are specified
- [x] Concurrent-session list/revoke contract specified without IP/geo
- [x] ADR-015 policy table includes additive session-inventory fail-open rows
- [x] Demo retention policy and deferred-risk list are recorded
- [x] No application code changed; no secrets or PHI in docs

## Dependencies

- Shipped: SEC-008, BE-021, FE-035
- Blocks: BE-022, BE-023, QA-005
- FE-036 waits on BE-023, not on this task’s docs landing except via BE-023

## Validation

- Doc review against `apps/api` auth, clinical, billing, and admin routes
- No `apps/` diff

## Risks / Considerations

- Docs-only: no version bump (ADR-007).
- ADR-016 is a documentation decision, not a new authorization engine.
- Do not weaken idle timeout by specifying an activity keep-alive.

## Implementation notes

Writing this spec is not a version bump. Shipping the docs is not a version bump.

Suggested order: ADR-016, identity contract, ADR-015 additive rows, api-endpoints, architecture
and compliance pages, capability `planned` row if not already present from M17 planning.

## Completion

Shipped as docs only. ADR-016 keeps `SUPER_ADMIN` on the session membership practice. The identity
contract, API index, security architecture, and data architecture match that HTTP plus the M17
clinical list-audit names and session inventory contract (no IP, location, or raw user-agent).
ADR-015 adds fail-open session-user rows for `GET /auth/sessions` (60 / 5 min) and
`POST /auth/sessions/:id/revoke` (30 / 5 min). Demo retention is synthetic data and seed reset,
with no RTBF HTTP and no patient DELETE. Deferred risks are listed in the compliance pages.
`identity-access.concurrent-sessions` stays `planned`. `security.hipaa-certification` stays
`out_of_scope`. No version bump (ADR-007). No `apps/` change.
