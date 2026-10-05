# Marketing capability matrix

Public-claim ceiling for the marketing site. Capability **catalog and status** live in
[docs/product/](../product/README.md), not this table. Milestone snapshot:
[post-mvp-baseline.md](../roadmap/post-mvp-baseline.md). Marketing copy must not exceed this
matrix.

This file is a **claim view** of the registry plus infrastructure rows that are not product
modules (CI, hosted deploy). If a row and its catalog file disagree, fix both.

Columns:

- **Catalog** — product module file, or — for infra-only rows.
- **Demo app** — exists in the authenticated application (mock and/or live Nest as documented).
- **Public site** — how marketing may describe it.
- **Planned** — acknowledged future work; do not imply it ships in the current demo.

| Capability | Catalog | Demo app | Public site | Planned |
| --- | --- | --- | --- | --- |
| Authentication (mock IdP, sessions) | [identity-access](../product/identity-access.md) | Yes | Yes — labeled mock identity, not production OAuth | OAuth 2.0 / OIDC + PKCE, production MFA ([ADR-003](../decisions/ADR-003-authentication.md)) |
| Patient management | [patient-management](../product/patient-management.md) | Yes | Yes | — |
| Scheduling (appointments, calendar) | [scheduling](../product/scheduling.md) | Yes | Yes | — |
| Clinical / EHR foundation | [patient-management](../product/patient-management.md) | Yes (lists on patient profile) | Yes, as foundation | External EHR integrations |
| Telehealth | [telehealth](../product/telehealth.md) | Session shell (create/join/end, waiting room placeholders) | Concept/demo — not live video | Daily / WebRTC, chat, recording, signaling |
| Billing | [billing](../product/billing.md) | Invoice list/detail | Concept/demo for payments and claims; invoices are real demo data | Hosted payments, claims submission, EDI |
| Analytics | [analytics](../product/analytics.md) | Live Nest dashboard overview cards; mock fixtures when mocks on | Qualified — demo cards, not a warehouse or HIPAA analytics | Extra chart widgets remain unscheduled |
| Notifications | [notifications](../product/notifications.md) | In-app inbox, mark-read, and channel preferences (session user only) | Qualified — not push, SMS, or email carriers | Push/SMS/email carriers, Redis |
| Administration | [administration](../product/administration.md) | User directory + audit viewer | Yes, with those limits | M10 role assignment (BE-013, FE-026); security-events HTTP remains M11 |
| RBAC, tenant isolation, audit, document ACL | [security](../product/security.md) | Yes (demo patterns) | Yes, as implemented engineering patterns | — |
| HIPAA certification | [security](../product/security.md) | No | Must not claim | Organizational compliance is out of this demo |
| GitHub Actions CI | — | Yes (PR/`main` quality gates) | Not a hosted production | INFRA-005 |
| Cloud deploy / preview | — | Partial (ECS API + Amplify Hosting + PR previews + production ECS workflow; operator apply/connect) | Must not claim a hosted production | M9 **PAUSED / BLOCKED** — AWS unavailable (INFRA-004–INFRA-012 shipped; INFRA-014 pending, blocks INFRA-013; INFRA-013 paused) |

## Copy examples

Allowed: “appointment-linked telehealth session shell”; “invoice list with labeled payment and
claims boundaries”; “live dashboard overview cards (synthetic demo aggregates)”; “security-focused
architecture”; “synthetic demo data”.

Not allowed: “live video visits”; “accept payments”; “HIPAA compliant”; “production OAuth”;
“hosted on AWS” (until a later deploy milestone ships).
