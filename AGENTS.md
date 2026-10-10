<!-- Project agent notes. Next.js app-specific agent files live in apps/web. -->

Canonical documentation: `/docs`. Product capability catalog:
[docs/product/](docs/product/README.md) (statused; not tasks). Current demo position: M0–M8
shipped (FE-017–FE-023)
([docs/roadmap/post-mvp-baseline.md](docs/roadmap/post-mvp-baseline.md)). **M9 — Deployment /
preview infrastructure** is **PAUSED / BLOCKED** — AWS account setup unavailable (close audit
found no missing IDs; not closed; not cancelled; INFRA-004–INFRA-012 shipped; INFRA-014 pending,
blocks INFRA-013; INFRA-013 paused). **M10** is shipped (DATA-002, BE-011, FE-024, BE-012,
FE-025, BE-013, FE-026). **M11** is shipped (BE-014, FE-027, FE-028, BE-015, FE-029,
SEC-005). **M12 — Telehealth Media Maturity** is shipped (BE-016, FE-030). **M13 — Billing /
Payments UX** is shipped (FE-031, FE-032). Hosted Stripe/ACH, claims submission / EDI 837, and
invoice-create UI remain later. **M14 — OAuth / External Identity** is shipped and
**closed** at 0.77.0 (SEC-006, DATA-003, BE-017, FE-033). **M15 — API Protection and Rate
Limiting** is in progress: SEC-007, DATA-004, and BE-018 shipped (ADR-015); BE-019, BE-020, FE-034 pending. Local product work does not wait on AWS.

Frontend application: `apps/web`.
Backend application: `apps/api` (NestJS 12 platform; OpenAPI via `npm run openapi:generate`).

Process files (do not inline these prompts into rules):

- Plan a task: [docs/processes/prompts/plan-mode-prompt.md](docs/processes/prompts/plan-mode-prompt.md)
- New task spec: [docs/processes/prompts/generate-new-task-prompt.md](docs/processes/prompts/generate-new-task-prompt.md)
- Design brief (human paste): [docs/processes/prompts/design-brief-prompt.md](docs/processes/prompts/design-brief-prompt.md)
- Figma design system: [docs/processes/prompts/figma-design-system-prompt.md](docs/processes/prompts/figma-design-system-prompt.md)
- Design constraints/workflow: [docs/workflows/design-requirements.md](docs/workflows/design-requirements.md)
- Milestone close: [docs/processes/prompts/milestone-close-prompt.md](docs/processes/prompts/milestone-close-prompt.md)
