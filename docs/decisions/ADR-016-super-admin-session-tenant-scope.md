# ADR-016 — SUPER_ADMIN session-tenant scope

## Status

Accepted (SEC-009). This is a documentation decision. It does not add an authorization engine.
Implementation tasks that depend on it are
[BE-022](../tasks/backend/BE-022-clinical-record-read-audit.md),
[BE-023](../tasks/backend/BE-023-concurrent-session-inventory-http.md), and
[QA-005](../tasks/qa/QA-005-authorization-and-tenant-regression-expansion.md).

## Context

[identity-and-access.md](../contracts/identity-and-access.md) said `SUPER_ADMIN` may act across
practices. Shipped HTTP does not. Login binds one `practice_memberships` row
(`AuthService.bindMembership`). Resource routes then filter on that session’s
`TenantContext.practiceId`, including for `SUPER_ADMIN` (practice user directory, role assignment,
audit list, security events). `admin:global` is a catalog permission held by `SUPER_ADMIN`. No
route uses it to read another practice.

A client-supplied `practiceId` on resource HTTP is ignored for authorization and rejected on
mismatch. Missing cross-practice reads are the demo boundary, not an insecure direct object
reference.

## Decision

- After login, every role including `SUPER_ADMIN` is scoped to the session’s
  `practice_memberships` row. Repositories filter on that server-resolved `practiceId`. Absence of
  cross-practice reads is accepted demo scope, not an IDOR.
- A client `practiceId` on resource HTTP never widens scope. It is ignored for authorization and
  rejected when it does not match the session practice.
- `admin:global` stays a catalog string. Holding it is not a cross-practice HTTP bypass.
- Login’s optional `practiceId` may select only a membership the caller already holds
  (`bindMembership`). A practice the user does not belong to is `TenantMismatchError`. That binding
  is not a practice switcher. OIDC session issuance does not take a client practice id; it requires
  exactly one membership.
- Operating outside the session practice requires a future server-derived practice-select that
  issues a new session membership. That API is not part of M17. It must not trust a client-supplied
  `practiceId` as authorization.

This decision does not change PROVIDER billing, add patient DELETE, or claim HIPAA compliance.

## Alternatives rejected

- **Implement a cross-practice switcher now.** A practice-select API and cross-practice HTTP are
  out of M17. Shipping them would be a new authorization surface, not a documentation fix.
- **Leave the identity-contract “all practices” sentence unmodified.** That sentence contradicts
  shipped session-tenant HTTP (BE-010, BE-013, SEC-003, BE-015). The more specific shipped mapping
  wins.

## Consequences

- The identity contract, security architecture, and data architecture describe `SUPER_ADMIN` as
  session-membership scoped ([SEC-009](../tasks/security/SEC-009-m17-security-findings-and-contract-reconciliation.md)).
- QA-005 adds session-tenant allow and foreign-practice deny cases for `SUPER_ADMIN`. It does not
  add a cross-practice allow case.
- No new guards, migrations, or version bump. ADR-007 treats this documentation decision as not a
  product change.
