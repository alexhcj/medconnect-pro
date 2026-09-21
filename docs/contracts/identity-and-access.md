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
| `admin:practice` | Manage practice profile and practice-level settings. |
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

Tenant-owned records persist `practice_id` (or equivalent). PostgreSQL RLS may add defense in depth
when the database exists ([DATA-001](../tasks/backend/DATA-001-postgresql-tenant-model.md),
[SEC-002](../tasks/security/SEC-002-tenant-isolation.md)). Cache keys and object-storage paths must
include tenant scope when those stores exist.

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

Response DTOs expose only authorized fields ([data-contracts.md](data-contracts.md) `PatientRdo`).
Clinical fields must not leak to `read:demographics`-only actors.

**Frontend is not enforcement.** Navigation visibility, route segments, hidden form fields, and
`SessionInfo.permissions` in the browser are UX hints. Authoritative checks belong on the server
(planned NestJS Identity & Access module). QA coverage for the matrix is
[QA-004](../tasks/qa/QA-004-authorization-and-tenant-tests.md).

## Session rules

Auth **session** (this document) is not a telehealth visit session
([BE-006](../tasks/backend/BE-006-telehealth-session-api.md)).

Timeouts below are **demo policy** for implementers, not production SLAs.

### Target architecture

- OAuth 2.0 + OpenID Connect, Authorization Code + PKCE ([ADR-003](../decisions/ADR-003-authentication.md)).
- MFA / TOTP after primary authentication when policy requires it.
- Short-lived access token (demo default: 15 minutes).
- Refresh-token rotation on use; refresh lifetime cannot exceed the absolute session cap.
- Logout (current session) and logout-all (all sessions for the user).
- Browser session in real mode: `HttpOnly`, `Secure`, `SameSite` cookies. Do not verify backend JWTs
  or hash passwords in the browser ([package-baseline.md](../package-baseline.md)). Do not add
  NextAuth as a second identity stack.

Planned application session/BFF routes are listed in [api-endpoints.md](api-endpoints.md). Those
routes are not a custom password IdP as the production identity design. The target user-facing
login is the IdP authorize/callback flow; password-shaped `POST /auth/login` and MFA verify may
stand in for a mock IdP or BFF until that flow exists.

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
production identity infrastructure. Mock tokens and `localStorage` stand-ins are not the real-mode
cookie model.
