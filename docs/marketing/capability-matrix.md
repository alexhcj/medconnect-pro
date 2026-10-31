# Marketing capability matrix

Public-claim ceiling for the marketing site. Capability **catalog and status** live in
[docs/product/](../product/README.md), not this table. Milestone snapshot:
[post-mvp-baseline.md](../roadmap/post-mvp-baseline.md). Marketing copy must not exceed this
matrix.

This file is a **claim view** of the registry plus infrastructure rows that are not product
modules (CI, hosted deploy). If a row and its catalog file disagree, fix both.

Last synced release: 0.103.4

Keep the line above equal to the root `package.json` version whenever a task ships or a milestone
closes. `npm run docs:marketing-sync` fails when it drifts. After a claim-affecting release, also
re-audit `apps/marketing/src/components/marketing/*-copy.ts` against this table.

Columns:

- **Catalog** — product module file, or — for infra-only rows.
- **Demo app** — exists in the authenticated application (mock and/or live Nest as documented).
- **Public site** — how marketing may describe it.
- **Planned** — acknowledged future work; do not imply it ships in the current demo.

| Capability | Catalog | Demo app | Public site | Planned |
| --- | --- | --- | --- | --- |
| Authentication (mock IdP, sessions) | [identity-access](../product/identity-access.md) | Yes (Nest HttpOnly cookies + opaque bearer JSON for machine clients; live Next does not persist tokens; labeled mock MFA on `/login`; demo OIDC + PKCE with Google or Fake adapter; demo API rate limits on login, MFA, refresh, OAuth, telehealth create/join/media-token, document download, and payments with `auth.rate_limited` security events and an accessible "too many attempts" message on sign-in, MFA, and OAuth landing; demo concurrent-session review lists the caller's sessions and can end other sessions without signing out; live rows omit IP and location; mock location and IP stay labeled demo data). One synthetic patient (Avery Quinn) can sign in with no MFA. The public Render login hides the provider button unless `NEXT_PUBLIC_OAUTH_ENABLED` is exactly true (unset on Render) and does not complete Google or Fake sign-in. When `NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS=true` (the Render web service), `/login` lists four synthetic accounts with role labels, fill and copy actions, and the MFA nurse code. Production builds leave the flag unset. | Yes — labeled mock identity, mock MFA, and "Demo OIDC + PKCE (Google or Fake). Not a production IdP." May say "demo rate limiting on sign-in and sensitive API routes" and "demo concurrent-session review" (list and end other sessions). Not production OAuth, production MFA, production abuse protection, or a production session manager. Do not say the public demo completes Google or Fake sign-in. Do not describe a patient portal on the marketing site (no portal product, portal features, or patient sign-up). A role-scope line for the synthetic Patient role is allowed when it matches the app's role nav and the identity contract, for example the homepage "Who it is for" card "Own appointments, telehealth visits, and invoices only." Do not list fixture passwords in marketing prose. The marketing demo-page screenshot may show the same synthetic sign-in panel as `/login`, including fixture passwords. | Production OAuth / IdP and production MFA stay later ([ADR-003](../decisions/ADR-003-authentication.md)) |
| Patient management | [patient-management](../product/patient-management.md) | Yes | Yes | — |
| Scheduling (appointments, calendar) | [scheduling](../product/scheduling.md) | Yes | Yes | Waitlist and check-in / check-out (not in the demo) |
| Clinical / EHR foundation | [patient-management](../product/patient-management.md) | Yes (lists on patient profile) | Yes, as foundation | External EHR integrations |
| Telehealth | [telehealth](../product/telehealth.md) | Session shell plus Daily call-object media when `DAILY_API_KEY` is set; labeled unavailable otherwise; leave does not end the visit; ended/ineligible visits stay closed; mock mode keeps placeholders. A portal patient or assigned nurse opens an existing visit from Join visit; writers still create the session. Lookup says the visit is not open yet when none exists. | Qualified — demo Daily media, not production telehealth or HIPAA video | Chat, recording, transcription |
| Billing | [billing](../product/billing.md) | Invoice list/detail plus demo record-payment and labeled claims envelopes | Qualified demo payments and envelopes; not hosted Stripe or claims submission | Hosted payments, claims submission, EDI |
| Analytics | [analytics](../product/analytics.md) | Live Nest dashboard overview cards; mock fixtures when mocks on | Qualified — demo cards, not a warehouse or HIPAA analytics | Extra chart widgets remain unscheduled |
| Notifications | [notifications](../product/notifications.md) | In-app inbox, mark-read, and channel preferences (session user only) | Qualified — not push, SMS, or email carriers | Push/SMS/email carriers, Redis |
| Administration | [administration](../product/administration.md) | User directory, audit viewer, role assignment, and tenant-scoped security-events viewer | Yes, with tenant/grant limits; security events are auth/session rows, not a SIEM | — |
| RBAC, tenant isolation, audit, document ACL | [security](../product/security.md) | Yes (demo patterns) | Yes, as implemented engineering patterns | — |
| HIPAA certification | [security](../product/security.md) | No | Must not claim | Organizational compliance is out of this demo |
| GitHub Actions CI | — | Yes (PR/`main` quality gates) | Not a hosted production | INFRA-005 |
| Cloud deploy / preview | — | Partial (ECS API + Amplify Hosting + PR previews + production ECS workflow; operator apply/connect). Interim Render demo is INFRA-015 and INFRA-016 and is not AWS production. | Must not claim a hosted production or working public OAuth. The Render URL may be named as an interim synthetic demo. | M9 **PAUSED / BLOCKED** — AWS unavailable (INFRA-004–INFRA-012 shipped; INFRA-014 pending, blocks INFRA-013; INFRA-013 paused). M18 interviewer readiness is shipped (0.91.0). Manual Render PR previews for marketing and web are shipped (M20, INFRA-019). |

## Architecture page

The `/architecture` system map (`marketing-architecture-copy.ts`, FE-055) restates claims already
allowed above; it adds no capability. **Current** nodes are the public site, web app, NestJS API and
PostgreSQL. **External** nodes follow their rows: sign-in is mock identity through the OIDC adapter,
not production OAuth (Authentication); Daily media works when configured (Telehealth); Render is
the interim synthetic demo host (Cloud deploy). **Planned** nodes (Redis, S3/KMS, AWS production)
stay dashed and labelled "Planned" until their rows change.

## About roadmap board

The `/about` "Implementation state" board (`MARKETING_ABOUT_STATE`, FE-054) lists Shipped, In
progress and Up next items plus one Paused line. **Shipped** items must be allowed by a row above
(Application demo, Security patterns, PR previews and delivery lanes, interim Render demo hosting,
and the design refresh: marketing pages plus web-app forms, dates and select lists, shipped in M21).
**In progress** and **Up next** may name roadmap work that is not a capability row, such as the
preview lanes pilot, the 1.0.0 demo release and post-1.0 accessibility follow-ups, from
[release-roadmap.md](../roadmap/release-roadmap.md). Those items are not shipped claims. Never
move one to Shipped before it ships, and never use task IDs. AWS production hosting stays on the
Paused line until the Cloud deploy row changes.

## Copy examples

Allowed: “appointment-linked telehealth session shell”; “demo Daily call-object media when
configured”; “invoice list with demo record-payment and labeled claims envelopes”; “live dashboard overview
cards (synthetic demo aggregates)”; “security-focused architecture”; “synthetic demo data”.

Not allowed: “live video visits”; “HIPAA-certified video”; “production telehealth”; “accept
payments”; “HIPAA compliant”; “production OAuth”; “hosted on AWS” (until a later deploy
milestone ships).
