<!-- Project agent notes. Next.js app-specific agent files live in apps/web. -->

Canonical documentation: `/docs`. Product capability catalog:
[docs/product/](docs/product/README.md) (statused; not tasks).

Current: M18 closed at 0.91.0; M19 closed at 0.96.3 (FE-040 to FE-047, BE-025, BE-026, DATA-006, QA-008, QA-009 shipped; latest release 0.96.3); M20 closed at 0.103.7 (INFRA-018, INFRA-019, QA-011, SEC-010, FE-048, INFRA-020, SEC-011 shipped; last M20 bump 0.97.4; QA-010 shipped 2026-10-31, test and docs only); standalone FE-049 shipped at 0.98.0 and FE-050 shipped at 0.99.0 (no milestone); marketing copy sync shipped at 0.99.1; M21 closed at 0.103.1 (marketing and web app design refresh; QA-012 shipped at 0.99.2, FE-051 shipped at 0.99.3, FE-052 shipped at 0.99.4, FE-053 shipped at 0.99.5, FE-054 shipped at 0.99.6, FE-055 shipped at 0.100.0, FE-056 shipped at 0.100.1, FE-057 shipped at 0.101.0, FE-058 shipped at 0.102.0, FE-059 shipped at 0.103.0, FE-060 shipped at 0.103.1; close-out copy and screenshot sync at 0.103.2; README and marketing card sync at 0.103.3; SEC-012 audit fix at 0.103.4; date picker scroll fix at 0.103.5, date picker keyboard and zoom fix at 0.103.6; About board update and M20 close at 0.103.7); standalone INFRA-021 shipped at 1.0.0 (Render demo release after a `/release-check` GO, AWS production moves to 1.x; no active milestone); standalone FE-061 shipped at 1.0.1 (input border contrast token); standalone INFRA-023 in progress (QA-010 Render follow-ups, docs only; hours reading due 2026-11-09 to 2026-11-16); standalone QA-013 shipped (M21 verification sweep, test and docs only, no version bump); standalone SEC-012 shipped at 0.103.4 (production audit findings cleared); standalone INFRA-022 shipped (architecture overview, request lifecycle and ADR index; docs only, no version bump); **M22 Telehealth 2.0: Visit experience in progress** (SEC-013 contract shipped, docs only, no version bump; DATA-007 shipped at 1.1.0 (staff display identity, demo visit reason); BE-027 shipped at 1.2.0 (passive requests, heartbeat, host-only End visit, session participants); FE-062 implemented at 1.3.0 (green room; fixes at 1.3.1; production check in progress); FE-063 implemented at 1.4.0 (full-screen call stage and controls; live two-browser check pending); FE-064 implemented at 1.5.0 (call states, in-visit keep-alive, wrap-up; 25-minute hidden-tab run pending); FE-065 implemented at 1.6.0 (demo persona camera; two-browser check pending); QA-014 pending; latest release 1.6.0; MINOR releases from 1.1.0; agents never bump MAJOR (ADR-007 MINOR cap, 2026-11-08)); M23 Telehealth 2.0: Clinical controls planned; M9 paused; see [docs/roadmap/release-roadmap.md](docs/roadmap/release-roadmap.md).

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
