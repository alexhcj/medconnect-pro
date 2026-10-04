# Product Roadmap

Current ship state is [post-mvp-baseline.md](post-mvp-baseline.md), not the historical labels below.
Demo milestones M0–M8 are shipped (FE-017–FE-023). Deployment/preview is **M9**
(INFRA-004–INFRA-008 shipped; INFRA-009–INFRA-013 pending).

The MVP / Expansion / Maturity lists remain storytelling stages. They are not a claim that
expansion is still unshipped.

## Portfolio MVP

Shipped as M0–M3 plus basic audit. Basic analytics remain mock overview cards only (frontend
Slice 2; no Nest `GET /dashboard/overview`).

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
- administration (users + audit viewer; no role PATCH);
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
