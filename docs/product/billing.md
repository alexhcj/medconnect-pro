---
id: billing
type: capability-module
name: Billing
area: billing
marketing_path: /platform/billing
status: partial
claim: "Invoice list and detail plus demo record-payment on an in-process adapter. Claims stay a labeled boundary. Not hosted payments or EDI submission."
related_tasks: [FE-008, FE-015, BE-007, FE-031]
related_docs:
  - ../01-product-requirements.md
  - ../marketing/capability-matrix.md
  - ../roadmap/post-mvp-baseline.md
capabilities:
  - id: billing.invoices
    name: Review invoices
    status: shipped
    demo: invoice list and detail with synthetic demo data
    public: yes
    related_tasks: [FE-008, FE-015, BE-007]
  - id: billing.payments
    name: Collect payments
    status: shipped
    demo: record stripe or ach through the in-process demo adapter; no card or bank fields
    public: qualified
    planned_next: hosted payments (Stripe/ACH)
    related_tasks: [FE-031, BE-007]
  - id: billing.claims
    name: Submit and track claims
    status: planned
    demo: labeled claims boundary only
    public: no
    planned_next: claims submission / EDI 837
    related_tasks: []
---

# Billing

Invoices and demo record-payment are real demo surfaces. Claims stay a labeled boundary. Do not
claim hosted Stripe, ACH origination, or claims submission / EDI 837.

| ID | Name | Status | Demo | Public |
| --- | --- | --- | --- | --- |
| `billing.invoices` | Review invoices | shipped | list and detail | yes |
| `billing.payments` | Collect payments | shipped | in-process demo adapter | qualified |
| `billing.claims` | Submit and track claims | planned | labeled boundary | no |
