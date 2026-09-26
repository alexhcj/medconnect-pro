---
id: BE-007
type: task
area: backend
feature: billing
status: implemented
priority: medium
estimate: 4
dependencies: [BE-001,DATA-001]
related_adrs: []
related_docs: [backend-architecture.md,../contracts/api-endpoints.md]
plane:
  work_item_id: 10ca6d71-df69-4ac6-84e1-604ee2076265
  identifier: MEDCONNECT-16
---

# BE-007 — Billing API

## Objective

Implement billing account/invoice/payment boundaries.

## Scope

Keep external Stripe/ACH integration behind an adapter boundary.

## Technical constraints

- Follow the project architecture.
- Preserve tenant and authorization boundaries.
- Use synthetic demo data only.
- Follow accessibility and responsive requirements.
- Do not introduce unnecessary dependencies.

## Acceptance criteria

- [x] Invoice endpoints exist
- [x] Payment boundary exists
- [x] Tenant scope enforced
- [x] Audit events exist

## Implementation notes

Do not store raw payment card data.

## Completion

- Implementation: NestJS billing module with `GET`/`POST /billing/invoices`, `GET /billing/invoices/:id`, `POST /billing/payments`, and `GET /billing/claims`. Invoices and payments persist tenant-scoped with `practice_id`. Payments go through an in-process Stripe/ACH adapter and never store PAN. Claims are labeled `edi837` envelopes derived from visible invoices (no EDI generation). `synthetic` is always true. Nurses are denied this practice-revenue surface. PATIENT `write:billing` records own payments only. Frontend live billing client still 404s until a later connect task.
- Tests: Access and schema units; service units for create, nurse denial, own-patient payment, paid conflict, and adapter input; HTTP tests for anonymous access, card-field rejection, receptionist/admin create, provider read vs write denial, nurse 403, portal self-pay, cross-tenant not-found, client `practiceId` mismatch, payment conflict, claims envelopes, and audit without PHI (`npm run test:api` with Compose Postgres).
- PR:
- Notes: Billing accounts are implicit (patient + practice). No Stripe SDK. Frontend wiring stays out of scope (same pattern as BE-006 vs FE-014). Visit-context nurse billing remains out of scope.
