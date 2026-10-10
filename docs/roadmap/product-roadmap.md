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
0.80.0 (SEC-007, DATA-004, BE-018, BE-019, BE-020, FE-034). Local product work does not wait on AWS.

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
- telehealth foundation (M5 session shell; M12 Daily media is shipped and qualified);
- billing foundation (invoices, demo record-payment, labeled claims envelopes);
- administration (users + audit viewer + role assignment UI with tenant/grant limits);
- security hardening (partial: RBAC, RLS, document ACL, audit);
- observability (deferred with M9 deploy/preview).

## Maturity

Still future except M12 Daily media (shipped, qualified). Remaining telehealth work is chat,
recording, and Socket.IO — not a new M12 task.

- EHR integrations;
- telehealth maturity (chat, recording, Socket.IO; Daily media is M12);
- revenue cycle;
- reliability;
- performance;
- enterprise requirements.

Market planning numbers are assumptions for storytelling, not claimed historical production metrics.
