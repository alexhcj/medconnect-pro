# Feature Development Workflow

Canonical task lifecycle. Design (stage 2) applies to UI tasks only; skip it when the task omits
`design` or sets `design.required: false`. See [tasks/README.md](../tasks/README.md) for YAML.

| Stage                 | Deliverable                                    | Owner/tool        |
| --------------------- | ---------------------------------------------- | ----------------- |
| 1. Requirements       | Task spec, acceptance criteria                 | `/docs` + Cursor ([generate-new-task-prompt.md](../processes/prompts/generate-new-task-prompt.md)) |
| 2. Design             | Approved Figma/Pencil artifact                 | You + design tool ([design-requirements.md](design-requirements.md)) |
| 3. Technical planning | Implementation plan                            | Cursor Plan Mode ([plan-mode-prompt.md](../processes/prompts/plan-mode-prompt.md)) |
| 4. Implementation     | Working code                                   | Cursor Agent      |
| 5. Validation         | Tests, responsive checks, accessibility review | Cursor + browser  |
| 6. Completion         | Updated task status, evidence, docs            | You + Cursor      |

Do not implement a UI task while `design.required: true` and `design.status` is not `approved`.

## Detailed steps

1. Select/create task (stage 1). For UI work, follow the
   [design-requirements.md](design-requirements.md) workflow and
   [design-to-development-flow.md](../processes/flows/design-to-development-flow.md). Paste
   [design-brief-prompt.md](../processes/prompts/design-brief-prompt.md) when the task needs a
   design brief. Record design references on the same task (`design.file_url`, `design.frame`,
   `design.status`); do not open a separate design task.
2. Read requirements, architecture, contracts and ADRs.
3. Confirm dependencies. For UI tasks, confirm `design.status: approved` before planning
   implementation (stage 2, then 3).
4. Define acceptance criteria.
5. Implement a vertical slice (stage 4).
6. Add tests appropriate to risk (stage 5). Frontend: follow
   [frontend-testing.md](frontend-testing.md) (Vitest + Playwright).
7. Validate accessibility and responsive behavior when `validation.accessibility` /
   `validation.responsive` apply (or when the task is user-facing and those flags are absent).
8. Validate authorization and tenant boundaries.
9. Update documentation when architecture/contracts change.
10. Run lint/type-check/tests/build (`npm run lint`, `type-check`, `test`, and `e2e` when the
    slice is user-facing).
11. Classify SemVer impact and bump version plus changelog per [versioning.md](versioning.md)
    (before opening the PR).
12. Open PR. Quality CI must pass. The project-advertised Amplify preview URL is posted on the
    PR after `ci` succeeds ([deploy.md](deploy.md)). Review against that URL; the preview API
    and preview/demo database are shared across PRs. Merge to `main` is the only production
    delivery path ([release.md](release.md)): Amplify Git publishes the web; ECS migrate/deploy
    waits on CI and a GitHub `production` environment approval. Feature branches cannot deploy
    production.
13. Update Plane operational status.
14. Mark task complete only after acceptance criteria are verified (stage 6): set top-level
    `status` to `implemented` or `completed`, fill the Markdown Completion section, and set
    `implementation.status: complete` when that block is present.
