# Product Roadmap

Current ship state is [post-mvp-baseline.md](post-mvp-baseline.md), not the historical labels below.
Demo milestones M0–M8 are shipped (FE-017–FE-023). Deployment/preview is **M9**,
**PAUSED / BLOCKED** — AWS account unavailable (close audit found no missing IDs; not closed;
not cancelled; INFRA-004–INFRA-012 shipped; INFRA-014 pending, blocks INFRA-013; INFRA-013
paused). **M10** is shipped. **M11** is shipped (BE-014, FE-027, FE-028, BE-015, FE-029,
SEC-005). **M12 — Telehealth Media Maturity** is shipped
([BE-016](../tasks/backend/BE-016-telehealth-daily-media-token-http.md),
[FE-030](../tasks/frontend/FE-030-daily-media-session-shell.md)). **M13 — Billing / Payments UX**
is shipped ([FE-031](../tasks/frontend/FE-031-record-demo-payment.md),
[FE-032](../tasks/frontend/FE-032-claims-envelope-list.md)). Hosted Stripe/ACH, claims submission /
EDI 837, and invoice-create UI remain later. **M14 — OAuth / External Identity** is shipped and
**closed** at 0.77.0. **M15 — API Protection and Rate Limiting** is shipped and **closed** at
0.80.0 (SEC-007, DATA-004, BE-018, BE-019, BE-020, FE-034). **M16 — Live Telehealth** is shipped
at 0.81.0 (SEC-008, BE-021, FE-035). Chat, recording, and Socket.IO remain later. **M17 — Security
and Compliance Maturity** is shipped and **closed** at 0.84.1 (SEC-009, BE-022, BE-023, FE-036, QA-005). Local product
work does not wait on AWS. **M18 — Interview Demo Readiness** is the next milestone and is
**pending** (QA-006, DATA-005 shipped; BE-024, FE-037, FE-038, FE-039, INFRA-017, QA-007 pending). It does not
reopen M17 or close M9. Render PR previews, real Google OAuth credentials, chat, recording,
Socket.IO, hosted Stripe, and Redis stay deferred.

The MVP / Expansion / Maturity lists remain storytelling stages. They are not a claim that
expansion is still unshipped.

## Portfolio MVP

Shipped as M0–M3 plus basic audit. Basic analytics are live Nest overview cards
([FE-024](../tasks/frontend/FE-024-live-dashboard-overview.md); Nest `GET /dashboard/overview` is
[BE-011](../tasks/backend/BE-011-dashboard-overview-api.md), both shipped).

- authentication;
- dashboard shell;
- patient management;
- scheduling;
- basic audit logging;
- basic analytics (partial).

## Expansion

Shipped as M4–M7 foundations plus later demo hardening (M14 OAuth, M15 rate limits). Remaining:
observability and cloud (M9).

- EHR foundation;
- telehealth foundation (M5 session shell; M12 Daily media is shipped and qualified; M16 live
  visit workflow shipped);
- billing foundation (invoices, demo record-payment, labeled claims envelopes);
- administration (users + audit viewer + role assignment UI with tenant/grant limits);
- security hardening (partial: RBAC, RLS, document ACL, audit; M17 closed at 0.84.1);
- observability (deferred with M9 deploy/preview).

## Maturity

M12 Daily media is shipped (qualified). **M16** live visit workflow is shipped (eligibility,
leave versus end, pre-join). Remaining telehealth after M16 is chat, recording, and Socket.IO.
**M17** is application-level security and compliance maturity (audit, session inventory,
authorization regression).

- EHR integrations;
- telehealth maturity (M16 live workflow shipped; M18 adds patient entry of an open visit, then
  chat, recording, Socket.IO);
- revenue cycle;
- reliability;
- performance;
- enterprise requirements.

Market planning numbers are assumptions for storytelling, not claimed historical production metrics.
