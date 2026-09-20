# Feature Development Workflow

1. Select/create task.
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
