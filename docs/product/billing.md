---
id: billing
type: capability-module
name: Billing
area: billing
marketing_path: /platform/billing
status: partial
claim: "Invoice list and detail. Payments and claims are labeled boundaries, not hosted payments."
related_tasks: [FE-008, FE-015, BE-007]
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
    status: planned
    demo: labeled payment boundary only
    public: no
    planned_next: hosted payments (Stripe/ACH)
    related_tasks: []
  - id: billing.claims
    name: Submit and track claims
    status: planned
    demo: labeled claims boundary only
    public: no
    planned_next: claims submission / EDI 837
    related_tasks: []
---

# Billing

Invoices are real demo data. Payments and claims stay labeled boundaries. Do not claim hosted
payments, ACH, or claims submission.

| ID | Name | Status | Demo | Public |
| --- | --- | --- | --- | --- |
| `billing.invoices` | Review invoices | shipped | list and detail | yes |
| `billing.payments` | Collect payments | planned | labeled boundary | no |
| `billing.claims` | Submit and track claims | planned | labeled boundary | no |
