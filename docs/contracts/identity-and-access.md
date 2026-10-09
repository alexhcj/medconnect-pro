# Identity and Access Contract

Canonical role, permission, tenant-resolution, resource-authorization, and session model for
MedConnect Pro. Later backend, data, security, and QA tasks implement this model; they must not
invent a parallel vocabulary.

This is a demonstration contract. It is not a HIPAA certification claim.

Related decisions: [ADR-002](../decisions/ADR-002-tenant-isolation.md),
[ADR-003](../decisions/ADR-003-authentication.md). Architecture summary:
[security-architecture.md](../architecture/security-architecture.md). Historical role×resource
notes used as input (not canonical):
[archive boundary matrix](../archive/technical-implementation-tasks-v0.md).

Frontend TypeScript catalogs in `apps/web/src/types/auth/` must stay aligned with the strings in
this file. Browser checks remain UX only.

## Authorization chain

```text
Authentication
  → identity
  → practice / tenant (server-resolved)
  → role
  → permission
  → resource ownership / assignment
```

## Roles

Use these exact identifiers (`SCREAMING_SNAKE`). Meanings describe default **scope**, not a second
permission system.

| Role | Tenant scope | Patient scope | Clinical | Billing | Admin |
| --- | --- | --- | --- | --- | --- |
| `SUPER_ADMIN` | All practices | All permitted | All permitted | All | Global |
| `PRACTICE_ADMIN` | Own practice | Own practice | Administrative / explicitly granted | Own practice | Full practice |
| `PROVIDER` | Own practice | Assigned or otherwise authorized in-practice | Full authorized clinical | Relevant to care | Limited |
| `NURSE` | Own practice | Assigned | Vitals and other permitted clinical | Limited | Limited |
| `RECEPTIONIST` | Own practice | Demographics / administrative | None by default | Appointment and billing admin | Limited |
| `PATIENT` | Own relationship | Self | Own portal records | Own payments | Self |

`SUPER_ADMIN` may act across practices. That breadth is still derived from authenticated identity
on the server. A client-supplied “global” flag or tenant id must never grant it.

## Permissions

Closed catalog. Names are `action:resource`. These are coarse domain grants, not one string per
HTTP route. Endpoint implementations map to these strings.

| Permission | Meaning |
| --- | --- |
| `read:all_patients` | Read patient records in the resolved tenant (clinical fields still require clinical write/read rules below). |
| `read:assigned_patients` | Read records for patients assigned to the actor. |
| `read:demographics` | Read non-clinical patient fields. |
| `read:own_patient` | Read the authenticated patient’s own record. |
| `write:demographics` | Create or update non-clinical patient fields. |
| `write:medical_records` | Create or update clinical notes and records. |
| `write:vitals` | Create or update vitals. |
| `write:appointments` | Create or update appointments. |
| `read:billing` | Read billing artifacts in scope (practice-wide or self, via resource check). |
| `write:billing` | Create or update billing artifacts in scope. |
| `admin:practice` | Manage practice profile and practice-level settings, including reading tenant-scoped audit events (`GET /admin/audit-events`) and security events (`GET /admin/security-events`). |
| `admin:users` | Assign roles and manage users within tenant rules. |
| `admin:global` | Platform-wide administration. |

Having `read:all_patients` implies the ability to read assigned patients and demographics in that
tenant; callers should still check the most specific permission when encoding a rule, but default
grants may list the broader string only.

### Default grants

Additional grants are a future administration concern (permission management). They are not a
runtime editor in this task.

| Role | Default permissions |
| --- | --- |
| `SUPER_ADMIN` | All catalog permissions |
| `PRACTICE_ADMIN` | `read:all_patients`, `read:demographics`, `write:demographics`, `write:appointments`, `read:billing`, `write:billing`, `admin:practice`, `admin:users` |
| `PROVIDER` | `read:all_patients`, `read:assigned_patients`, `write:medical_records`, `write:vitals`, `write:appointments`, `read:billing` |
| `NURSE` | `read:assigned_patients`, `write:vitals`, `read:billing` |
| `RECEPTIONIST` | `read:demographics`, `write:demographics`, `write:appointments`, `read:billing`, `write:billing` |
| `PATIENT` | `read:own_patient`, `read:billing`, `write:billing` |

`PRACTICE_ADMIN` does **not** receive `write:medical_records` or `write:vitals` by default.
Clinical writes for that role require an explicit extra grant.

`PATIENT` billing permissions apply only to the patient’s own invoices and payments (resource
check). `PROVIDER` `read:billing` is limited to billing relevant to authorized care. `NURSE`
`read:billing` is limited (for example visit-context amounts), not practice revenue administration.

## Tenant resolution

Practice/tenant context is derived from authenticated identity and enforced server-side
([ADR-002](../decisions/ADR-002-tenant-isolation.md)).

Ordered rules:

1. Authenticate the user (IdP or mock IdP). Reject anonymous access to protected resources.
2. Load memberships (user ↔ practice ↔ role) from server-side identity data, not from the request
   body, query, headers, or hidden fields.
3. Resolve `practice_id` into request context:
   - `SUPER_ADMIN`: may select or operate across practices; the set of allowed practices comes from
     identity, not from a client-supplied id.
   - Practice-scoped staff (`PRACTICE_ADMIN`, `PROVIDER`, `NURSE`, `RECEPTIONIST`): the practice
     bound to the session membership.
   - `PATIENT`: the practice(s) of the patient’s own relationship; no staff tenant switch.
4. Attach that scope to the request. Repositories and services filter tenant-owned records by it.
5. Ignore or reject client-supplied `practice_id` / `practiceId` for authorization decisions.
   Presence of a matching id in a DTO is not authorization.

Tenant-owned records persist `practice_id` (or equivalent). PostgreSQL and TypeORM tenant scoping
exist ([DATA-001](../tasks/backend/DATA-001-postgresql-tenant-model.md),
[ADR-010](../decisions/ADR-010-postgresql-typeorm.md)). PostgreSQL RLS adds defense in depth
([SEC-002](../tasks/security/SEC-002-tenant-isolation.md)): the application role is not the table
owner, and policies filter tenant-owned rows by server-resolved `app.current_practice_id`. Cache
keys and object-storage paths must include tenant scope when those stores exist.
Document object keys use `practices/{practiceId}/patients/{patientId}/{documentId}`
([SEC-004](../tasks/security/SEC-004-document-access-control.md)).

**Mock mode:** the same chain applies. Identity and memberships come from fixtures. Mock
authentication is not production identity infrastructure ([ADR-003](../decisions/ADR-003-authentication.md)).

## Resource authorization

Evaluate in order. Deny if any step fails. Unknown resource ids and cross-tenant ids deny without
confirming whether the id exists (no resource oracle).

1. **Tenant.** Record `practice_id` must match the server-resolved scope (`SUPER_ADMIN` may match
   any practice they are allowed to operate on).
2. **Role.** Actor must hold an allowed role for the operation’s domain.
3. **Permission.** Actor must hold a catalog permission that covers the operation.
4. **Ownership or assignment.** Examples: provider/nurse assigned to the patient; receptionist
   limited to demographics; patient limited to self.

Telehealth session HTTP ([BE-006](../tasks/backend/BE-006-telehealth-session-api.md)) maps onto this
catalog without new permission strings:

- **Create / end:** `write:appointments`, and the linked appointment must be visible to the caller.
- **Get:** the same read scope as the linked appointment (`write:appointments` practice-wide,
  `read:assigned_patients` for nurses, `read:own_patient` for portal users).
- **Join:** visit participant only — the appointment’s provider, the portal patient, or an assigned
  nurse. Receptionists may create and end sessions but cannot join.
- **Media token** ([BE-016](../tasks/backend/BE-016-telehealth-daily-media-token-http.md)): the same
  visit-participant rule as join. Receptionists cannot mint. Client `practiceId` is ignored for
  authorization and rejected on mismatch.

Unknown and cross-tenant session ids return the same not-found response as other tenant-owned
resources.

Billing HTTP ([BE-007](../tasks/backend/BE-007-billing-api.md)) maps onto `read:billing` /
`write:billing` with resource checks:

- **Practice invoice list/get, claims list:** `read:billing` for `PRACTICE_ADMIN`, `RECEPTIONIST`,
  `PROVIDER`, and `SUPER_ADMIN`. This is practice revenue administration.
- **Create invoice:** `write:billing` for `PRACTICE_ADMIN`, `RECEPTIONIST`, and `SUPER_ADMIN`.
  `PATIENT` `write:billing` does not create invoices.
- **Record payment:** `write:billing` for practice administrators and receptionists (practice-wide)
  or `PATIENT` on their own invoice.
- **PATIENT reads:** own invoices and claims envelopes only.
- **NURSE:** denied on this surface. Catalog `read:billing` remains limited to visit-context amounts,
  which are not part of this API.

Unknown and cross-tenant invoice ids return the same not-found response as other tenant-owned
resources.

Notification HTTP ([BE-008](../tasks/backend/BE-008-notification-domain.md)) maps onto
authenticated self-scope without new permission strings:

- **List / mark read / get and update preferences:** any authenticated member of the resolved
  tenant, limited to the session actor (`recipient_user_id` / preference `user_id` must match).
- Unknown, cross-tenant, other-user, and mismatched `practiceId` values return the same
  not-found or tenant-mismatch response as other tenant-owned resources.
- There is no practice-wide inbox. Staff do not read another user’s notifications by role.

Document HTTP ([SEC-004](../tasks/security/SEC-004-document-access-control.md)) maps onto
`write:medical_records` / `read:own_patient` without new permission strings. Categories
(`intake` | `insurance` | `clinical`) are labels, not a second ACL:

- **Patient visibility first.** The patient must be readable under the existing demographics /
  assignment / portal-self rules. Unknown, cross-tenant, and mismatched `practiceId` values return
  the same not-found response as other tenant-owned resources.
- **List / download:** `write:medical_records`, or a portal user with `read:own_patient` reading
  their own record. Clinical reads follow write grants because the catalog has no separate
  document-read string.
- **Upload:** `write:medical_records` only. Default grants mean `PROVIDER` and `SUPER_ADMIN`.
  `PRACTICE_ADMIN`, `NURSE`, `RECEPTIONIST`, and `PATIENT` cannot upload unless an extra grant
  exists later.
- Bytes stream through Nest after authorization. Object-store keys are not public URLs.

Practice user directory HTTP ([BE-010](../tasks/backend/BE-010-practice-user-directory-api.md))
maps onto `admin:users` without a new catalog permission string:

- **List (`GET /admin/users`):** `admin:users` for `PRACTICE_ADMIN` and `SUPER_ADMIN`. Session-tenant
  scoped, including `SUPER_ADMIN` (same rule as [SEC-003](../tasks/security/SEC-003-audit-event-model.md)
  audit list). Join `practice_memberships` and `users` filtered by server-resolved
  `TenantContext.practiceId`.
- Identity tables (`users`, `auth_sessions`, `practice_memberships`) have no RLS so login can derive
  tenant. Application scoping on `practice_memberships.practice_id` is mandatory. Do not query users
  across practices.
- Client `practiceId` is ignored for authorization and rejected on mismatch. Unknown and cross-tenant
  ids must not oracle.
- `id` is the user id, not the membership id. `role` is the membership role for the resolved
  practice. `synthetic` is always true (`users` has no `synthetic` column). Passwords, MFA secrets,
  and session hashes are not returned.
- **Assign (`PATCH /admin/users/:id/roles`):** same `admin:users` permission and session-tenant
  scope, including `SUPER_ADMIN`. Body is a single catalog `role`. `PRACTICE_ADMIN` cannot grant
  `SUPER_ADMIN`. The last `PRACTICE_ADMIN` of the practice cannot be removed. Unknown and
  cross-tenant user ids return the same not-found response as other tenant-owned resources. A
  successful change emits `membership.role_changed` (no password/MFA/session hashes). Denied
  attempts follow existing `access.denied` patterns. Frontend assignment UI is
  [FE-026](../tasks/frontend/FE-026-role-assignment-ui.md).

Response DTOs expose only authorized fields ([data-contracts.md](data-contracts.md) `PatientRdo`).
Clinical fields must not leak to `read:demographics`-only actors.

**Frontend is not enforcement.** Navigation visibility, route segments, hidden form fields, and
`SessionInfo.permissions` in the browser are UX hints. Authoritative checks belong on the server
(NestJS Identity & Access module, [BE-009](../tasks/backend/BE-009-identity-and-access-http.md)).
QA coverage for the full role × resource matrix is
[QA-004](../tasks/qa/QA-004-authorization-and-tenant-tests.md).

## Session rules

Auth **session** (this document) is not a telehealth visit session
([BE-006](../tasks/backend/BE-006-telehealth-session-api.md)).

Timeouts below are **demo policy** for implementers, not production SLAs.

### Target architecture

- OAuth 2.0 + OpenID Connect, Authorization Code + PKCE ([ADR-003](../decisions/ADR-003-authentication.md)).
- Production MFA / TOTP or WebAuthn after primary authentication when policy requires it.
- Short-lived access token (demo default: 15 minutes).
- Refresh-token rotation on use; refresh lifetime cannot exceed the absolute session cap.
- Logout (current session) and logout-all (all sessions for the user).
- Do not verify backend JWTs or hash passwords in the browser
  ([package-baseline.md](../package-baseline.md)). Do not add NextAuth as a second identity stack.

Auth routes are listed in [api-endpoints.md](api-endpoints.md). Those routes are not a custom
password IdP as the production identity design. The target user-facing login is the IdP
authorize/callback flow; password-shaped `POST /auth/login` and MFA verify stand in for a mock IdP
until that flow exists.

### Implemented demo session (BE-014)

Nest is the session authority. Browser session cookies are **implemented-demo**, not production
OAuth or a Next.js BFF:

- `mcp_access` (Path `/`), `mcp_refresh` (Path `/auth`), and `mcp_mfa` (Path `/auth`) are HttpOnly.
- `Secure` when `APP_ENV` is not `local`. `SameSite=Lax` locally; `SameSite=None` for hosted
  preview/production (Amplify web origin is cross-site to the ECS API).
- Login, refresh, and MFA verify set cookies; logout and logout-all clear them.
- `AuthGuard` accepts the access cookie **or** `Authorization: Bearer`. Bearer wins when both are
  present. JSON token pairs remain for machine clients, Postman, and smoke tests.
- Refresh and MFA verify accept the token in the JSON body **or** the matching cookie.
- CSRF: JSON or multipart `Content-Type` plus the CORS origin allowlist locally. Hosted
  cookie-authenticated mutations also require `X-CSRF-Token` matching the non-HttpOnly `mcp_csrf`
  cookie. Bearer clients skip CSRF.

Live Next uses HttpOnly session cookies and does not persist access or refresh tokens
([FE-027](../tasks/frontend/FE-027-live-cookie-session-client.md)). Mock-mode `localStorage` is still
not the cookie model.

### Implemented demo OIDC (M14)

Planned until [BE-017](../tasks/backend/BE-017-oidc-client-and-session-issuance.md) ships.
Decision: [ADR-014](../decisions/ADR-014-oidc-bff-and-external-identity.md). This is a demo
integration, not production OAuth or HIPAA identity.

- **Flow:** `GET /auth/oauth/:provider/start` → provider authorize → `GET /auth/oauth/:provider/callback`
  → Nest issues the existing `mcp_*` cookies → redirect to a relative `returnTo`. The browser never
  receives provider tokens.
- **Mapping:** `(provider, sub)` match → user; else `email_verified` email matching a
  pre-provisioned user → first link; else reject. No JIT provisioning or self-signup. Mismatched
  `sub` / email never merges.
- **Protections:** PKCE S256; one-time `state` (PostgreSQL `oauth_flow_states`, short-lived);
  `nonce`; exact registered redirect URI; ID token `iss`, `aud`, `exp` validation;
  `email_verified` required; `returnTo` must be a relative path on an allowlist.
- **RBAC preservation:** roles and tenant come only from `practice_memberships`. IdP claims never
  become roles, permissions, or tenants.
- **Session reuse:** same idle/absolute/concurrent policy, refresh rotation, CSRF, and logout as
  BE-014. OAuth sessions do not chain mock MFA. Mock password login remains.
- **Audit actions:** `auth.oauth.succeeded`, `auth.oauth.failed`, `auth.oauth.linked`,
  `auth.oauth.identity_mismatch`. No tokens or provider claims beyond ids in metadata.
- **Local demo:** seeded `*@example.test` users cannot use real Google. The Fake adapter (Google
  env unset, local/test only) and the `OIDC_DEMO_EMAIL` seed hook cover local sign-in.

### Idle, absolute, and concurrent policy

- **Idle timeout:** 15 minutes without activity. The existing warning/extend UX may prompt before
  expiry; extension must be granted by the session authority, not by rewriting expiry only in the
  client.
- **Absolute cap:** 24 hours from session start (matches the current mock session length). Idle
  extension cannot pass this cap.
- **Concurrent sessions:** detectable; the user may terminate other sessions. The default **mock**
  fixture is a single current session so dashboard E2E is not blocked by a concurrent-session
  dialog. Extra-session fixtures belong in dedicated tests.

### Mock mode

The frontend may simulate an identity provider and session. Label it as mock. Do not describe it as
production identity infrastructure. Mock tokens and `localStorage` stand-ins are not the Nest
HttpOnly cookie session.
