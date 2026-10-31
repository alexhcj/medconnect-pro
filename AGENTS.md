<!-- Project agent notes. Next.js app-specific agent files live in apps/web. -->

Canonical documentation: `/docs`. Product capability catalog:
[docs/product/](docs/product/README.md) (statused; not tasks).

Current: M18 closed at 0.91.0; M19 closed at 0.96.3 (FE-040 to FE-047, BE-025, BE-026, DATA-006, QA-008, QA-009 shipped; latest release 0.96.3); M20 in progress (INFRA-018, INFRA-019, QA-011, SEC-010, FE-048, INFRA-020, SEC-011 shipped; latest release 0.97.4; QA-010 pending); standalone FE-049 shipped at 0.98.0 and FE-050 shipped at 0.99.0 (no milestone); marketing copy sync shipped at 0.99.1; M21 closed at 0.103.1 (marketing and web app design refresh; QA-012 shipped at 0.99.2, FE-051 shipped at 0.99.3, FE-052 shipped at 0.99.4, FE-053 shipped at 0.99.5, FE-054 shipped at 0.99.6, FE-055 shipped at 0.100.0, FE-056 shipped at 0.100.1, FE-057 shipped at 0.101.0, FE-058 shipped at 0.102.0, FE-059 shipped at 0.103.0, FE-060 shipped at 0.103.1; close-out copy and screenshot sync at 0.103.2, latest release 0.103.2); standalone INFRA-021 pending (1.0.0 = Render demo release after M20 and M21 close, AWS production moves to 1.x); standalone FE-061 and QA-013 pending after 1.0.0; M9 paused; see [docs/roadmap/release-roadmap.md](docs/roadmap/release-roadmap.md).

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
