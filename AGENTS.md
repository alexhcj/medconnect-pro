<!-- Project agent notes. Next.js app-specific agent files live in apps/web. -->

Canonical documentation: `/docs`. Current demo position: M0–M7 shipped; M8 marketing site shipped
(FE-017–FE-023)
([docs/roadmap/post-mvp-baseline.md](docs/roadmap/post-mvp-baseline.md)). Next after M8 is
**M9 — Deployment / preview infrastructure** (INFRA-004–INFRA-012 shipped;
INFRA-013 pending).

Frontend application: `apps/web`.
Backend application: `apps/api` (NestJS 12 platform; OpenAPI via `npm run openapi:generate`).

Process files (do not inline these prompts into rules):

- Plan a task: [docs/processes/prompts/plan-mode-prompt.md](docs/processes/prompts/plan-mode-prompt.md)
- New task spec: [docs/processes/prompts/generate-new-task-prompt.md](docs/processes/prompts/generate-new-task-prompt.md)
- Design brief (human paste): [docs/processes/prompts/design-brief-prompt.md](docs/processes/prompts/design-brief-prompt.md)
- Figma design system: [docs/processes/prompts/figma-design-system-prompt.md](docs/processes/prompts/figma-design-system-prompt.md)
- Design constraints/workflow: [docs/workflows/design-requirements.md](docs/workflows/design-requirements.md)
- Milestone close: [docs/processes/prompts/milestone-close-prompt.md](docs/processes/prompts/milestone-close-prompt.md)
