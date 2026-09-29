# Feature Development Workflow

1. Select/create task. For UI work, follow the
   [design-requirements.md](design-requirements.md) workflow and
   [design-to-development-flow.md](../processes/flows/design-to-development-flow.md). Paste
   [design-brief-prompt.md](../processes/prompts/design-brief-prompt.md) when the task needs a
   design brief.
2. Read requirements, architecture, contracts and ADRs.
3. Confirm dependencies.
4. Define acceptance criteria.
5. Implement a vertical slice.
6. Add tests appropriate to risk. Frontend: follow
   [frontend-testing.md](frontend-testing.md) (Vitest + Playwright).
7. Validate accessibility and responsive behavior.
8. Validate authorization and tenant boundaries.
9. Update documentation when architecture/contracts change.
10. Run lint/type-check/tests/build (`npm run lint`, `type-check`, `test`, and `e2e` when the
    slice is user-facing).
11. Classify SemVer impact and bump version plus changelog per [versioning.md](versioning.md)
    (before opening the PR).
12. Open PR.
13. Update Plane operational status.
14. Mark task complete only after acceptance criteria are verified.
