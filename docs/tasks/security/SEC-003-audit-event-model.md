---
id: SEC-003
type: task
area: security
feature: audit
status: planned
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

- [ ] Audit event schema exists
- [ ] Actor/tenant/action/resource captured
- [ ] Sensitive payloads minimized
- [ ] Access to audit data is restricted

## Implementation notes

Never put secrets or unnecessary PHI into audit payloads.

## Completion

- Implementation:
- Tests:
- PR:
- Notes:
