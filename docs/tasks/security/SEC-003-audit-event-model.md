---
id: SEC-003
type: task
area: security
feature: audit
status: implemented
priority: high
estimate: 3
dependencies: [BE-001,DATA-001]
related_adrs: []
related_docs: [security-architecture.md,data-architecture.md]
plane:
  work_item_id: efc0785f-89d1-4e78-95b7-247c2b9b64ad
  identifier: MEDCONNECT-39
---

# SEC-003 — Audit event model

## Objective

Create structured audit events for security-sensitive actions.

## Scope

Authentication, denied access, patient access, clinical changes, documents and admin security.

## Technical constraints

- Follow the project architecture.
- Preserve tenant and authorization boundaries.
- Use synthetic demo data only.
- Follow accessibility and responsive requirements.
- Do not introduce unnecessary dependencies.

## Acceptance criteria

- [x] Audit event schema exists
- [x] Actor/tenant/action/resource captured
- [x] Sensitive payloads minimized
- [x] Access to audit data is restricted

## Implementation notes

Never put secrets or unnecessary PHI into audit payloads.

## Completion

- Implementation: Shared `AuditModule` lists tenant-scoped `audit_events` at `GET /admin/audit-events` (`admin:practice`). Events capture actor, tenant, action, resource type/id, and correlation only. Emitters cover mock login/logout/MFA/refresh-reuse, authenticated denials, patient GET/create/update, plus existing appointment and clinical mutation writes. No JSON payload column. Frontend viewer stays FE-009. Documents and `GET /admin/security-events` stay unimplemented.
- Tests: Repository tenant isolation; access-path units; patient/auth service audit assertions; HTTP tests for anonymous 401, non-admin 403, practice-admin list (own tenant only), client `practiceId` mismatch, payload absence, and live auth/patient/appointment/denied actions (`npm run test:api` with Compose Postgres). Existing appointment and clinical mutation audit assertions remain.
- PR:
- Notes: Pre-auth failures without a resolved membership stay in request logs. List is session-tenant scoped, including SUPER_ADMIN. No new permission catalog string.
