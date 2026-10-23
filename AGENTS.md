<!-- Project agent notes. Next.js app-specific agent files live in apps/web. -->

Canonical documentation: `/docs`. Product capability catalog:
[docs/product/](docs/product/README.md) (statused; not tasks).

Current: M18 closed at 0.91.0; M19 closed at 0.96.3 (FE-040 to FE-047, BE-025, BE-026, DATA-006, QA-008, QA-009 shipped; latest release 0.96.3); M20 in progress (INFRA-018 shipped; INFRA-019 implemented at 0.97.0, hosted checks pending; INFRA-020, FE-048, QA-010 pending); M9 paused; see [docs/roadmap/release-roadmap.md](docs/roadmap/release-roadmap.md).

Frontend application: `apps/web`.
Marketing site: `apps/marketing` (static export).
Backend application: `apps/api` (NestJS 12 platform; OpenAPI via `npm run openapi:generate`).

Process files (do not inline these prompts into rules):

- Plan a task: [docs/processes/prompts/plan-mode-prompt.md](docs/processes/prompts/plan-mode-prompt.md)
- New task spec: [docs/processes/prompts/generate-new-task-prompt.md](docs/processes/prompts/generate-new-task-prompt.md)
- Design brief (human paste): [docs/processes/prompts/design-brief-prompt.md](docs/processes/prompts/design-brief-prompt.md)
- Figma design system: [docs/processes/prompts/figma-design-system-prompt.md](docs/processes/prompts/figma-design-system-prompt.md)
- Design constraints/workflow: [docs/workflows/design-requirements.md](docs/workflows/design-requirements.md)
- Milestone close: [docs/processes/prompts/milestone-close-prompt.md](docs/processes/prompts/milestone-close-prompt.md)
