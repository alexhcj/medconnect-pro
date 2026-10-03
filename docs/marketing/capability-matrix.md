# Marketing capability matrix

Prevents the public site from claiming features the demo does not have. Source of truth for
**implementation status** is [post-mvp-baseline.md](../roadmap/post-mvp-baseline.md), not this
table. Marketing copy must not exceed this matrix.

Columns:

- **Demo app** — exists in the authenticated application (mock and/or live Nest as documented).
- **Public site** — how marketing may describe it.
- **Planned** — acknowledged future work; do not imply it ships in the current demo.

| Capability | Demo app | Public site | Planned |
| --- | --- | --- | --- |
| Authentication (mock IdP, sessions) | Yes | Yes — labeled mock identity, not production OAuth | OAuth 2.0 / OIDC + PKCE, production MFA ([ADR-003](../decisions/ADR-003-authentication.md)) |
| Patient management | Yes | Yes | — |
| Scheduling (appointments, calendar) | Yes | Yes | — |
| Clinical / EHR foundation | Yes (lists on patient profile) | Yes, as foundation | External EHR integrations |
| Telehealth | Session shell (create/join/end, waiting room placeholders) | Concept/demo — not live video | Daily / WebRTC, chat, recording, signaling |
| Billing | Invoice list/detail | Concept/demo for payments and claims; invoices are real demo data | Hosted payments, claims submission, EDI |
| Analytics | Mock dashboard overview cards only | Concept/demo; no live Nest `GET /dashboard/overview` | Dashboard analytics API (frontend Slice 2) |
| Notifications | Nest domain HTTP exists; UI unwired | Do not present a notification center as shipped | Notifications UI |
| Administration | User directory + audit viewer | Yes, with those limits | Role assignment HTTP, security-events HTTP |
| RBAC, tenant isolation, audit, document ACL | Yes (demo patterns) | Yes, as implemented engineering patterns | — |
| HIPAA certification | No | Must not claim | Organizational compliance is out of this demo |
| Cloud deploy / preview / CI | No | Must not claim a hosted production | M9 (INFRA-004–INFRA-013, pending) |

## Copy examples

Allowed: “appointment-linked telehealth session shell”; “invoice list with labeled payment and
claims boundaries”; “mock dashboard overview cards”; “security-focused architecture”; “synthetic
demo data”.

Not allowed: “live video visits”; “accept payments”; “HIPAA compliant”; “production OAuth”;
“hosted on AWS” (until a later deploy milestone ships).
