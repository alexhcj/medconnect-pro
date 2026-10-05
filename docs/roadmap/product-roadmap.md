# Product Roadmap

Current ship state is [post-mvp-baseline.md](post-mvp-baseline.md), not the historical labels below.
Demo milestones M0–M8 are shipped (FE-017–FE-023). Deployment/preview is **M9**,
**PAUSED / BLOCKED** — AWS account unavailable (close audit found no missing IDs; not closed;
not cancelled; INFRA-004–INFRA-012 shipped; INFRA-014 pending, blocks INFRA-013; INFRA-013
paused). Next product module is **M10**. Local product work does not wait on AWS.

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

Shipped as M4–M7 foundations except observability and remaining hardening (OAuth, rate limits,
cloud).

- EHR foundation;
- telehealth foundation (session shell, not live media);
- billing foundation (invoices; payments/claims labeled boundaries);
- administration (users + audit viewer; role PATCH is M10 / BE-013);
- security hardening (partial: RBAC, RLS, document ACL, audit);
- observability (deferred with M9 deploy/preview).

## Maturity

Still future.

- EHR integrations;
- telehealth maturity;
- revenue cycle;
- reliability;
- performance;
- enterprise requirements.

Market planning numbers are assumptions for storytelling, not claimed historical production metrics.
