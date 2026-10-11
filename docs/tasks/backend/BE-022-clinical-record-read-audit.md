---
id: BE-022
type: task
area: backend
feature: audit
status: pending
priority: high
estimate: 2
dependencies: [SEC-009, SEC-003, BE-005]
related_adrs: [ADR-002-tenant-isolation.md]
related_docs:
  [
    ../../architecture/security-architecture.md,
    ../../architecture/data-architecture.md,
    ../../contracts/identity-and-access.md,
    ../../contracts/data-contracts.md,
    ../security/SEC-003-audit-event-model.md,
    ../security/SEC-009-m17-security-findings-and-contract-reconciliation.md,
    BE-005-clinical-record-api.md,
  ]
implementation:
  status: not_started
validation:
  responsive: false
  accessibility: false
  tests_required: true
plane:
  work_item_id: aba52522-a843-4e1d-8314-0def20f1eec4
  identifier: MEDCONNECT-104
---

# BE-022 — Clinical record read audit

## Objective

Emit tenant-scoped, no-PHI audit events when an authorized actor lists a patient’s clinical
history, conditions, vitals, or medications.

## Context

[SEC-003](../security/SEC-003-audit-event-model.md) audits patient GET (`patient.accessed`) and
clinical **creates**. [security-architecture.md](../../architecture/security-architecture.md) lists
“patient record access.” [`ClinicalService`](../../../apps/api/src/ehr/clinical.service.ts)
`listHistory`, `listConditions`, `listVitals`, and `listMedications` do not call
`AuditEventRepository`. Denied reads already flow through existing `access.denied` handling.

The contract is [SEC-009](../security/SEC-009-m17-security-findings-and-contract-reconciliation.md).
Do not recreate the audit schema, viewer, or clinical HTTP.

## Scope

- After successful authorization and load, emit:
  - `history.listed`
  - `condition.listed`
  - `vital.listed`
  - `medication.listed`
- Resource type/id is the **patient** id. Actor, tenant, action, resource, correlation only — no
  payload column, no names, condition text, vitals values, or tokens.
- Reuse [`AuditEventRepository`](../../../apps/api/src/audit/audit-event.repository.ts) in
  [`clinical.service.ts`](../../../apps/api/src/ehr/clinical.service.ts). One row per successful
  list GET (do not debounce).
- Unit and HTTP tests: event present; serialized audit call has no patient name, condition
  display, or secrets. Denied lists still do not write a listed-row (existing deny path).
- Existing `GET /admin/audit-events` already returns these actions; no new list API.

## Out of Scope

- Patient list / search audit
- Billing or appointment GET audit
- New audit columns, SIEM, HIPAA export
- Clinical write-path changes
- Frontend viewer redesign

## Requirements

- Nest remains authorization authority. Do not audit a list that failed visibility or
  `canReadClinical`.
- Never put PHI, tokens, or `DAILY_API_KEY` in audit rows, logs, Git, or docs.
- Four list GETs on one profile view produce four rows. That volume is accepted for the demo.

## Acceptance Criteria

- [ ] Each of `GET /patients/:id/history|conditions|vitals|medications` writes one tenant-scoped
      audit row with the specified action and patient resource id
- [ ] Audit JSON contains no patient name, clinical text, or tokens
- [ ] Unauthorized / not-found lists do not emit the listed action
- [ ] `GET /admin/audit-events` includes the new actions for `admin:practice`
- [ ] Existing clinical create audits and SEC-003 tests still pass

## Dependencies

- SEC-009, SEC-003, BE-005
- Does not wait on BE-023, FE-036, QA-005, or M9

## Validation

- Unit: [`clinical.service.spec.ts`](../../../apps/api/src/ehr/clinical.service.spec.ts)
- HTTP / audit: existing clinical and audit HTTP specs as needed
- `npm run test:api`, lint, type-check

## Risks / Considerations

- Shipping this slice is **MINOR** (new audit contract).
- Do not treat a passing suite as HIPAA compliance.

## Implementation notes

Reuse `recordAudit` already used by clinical creates. Do not add a payload column.

Writing this spec is not a version bump.
