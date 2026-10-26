@AGENTS.md

<!--
Claude Code entry point. AGENTS.md stays the shared, tool-neutral file (Cursor reads it too).
Keep this file under ~150 lines: it is loaded into every session and costs tokens every turn.
Always-on rules live in .claude/rules/*.md (no `paths`); path-scoped rules load only when
Claude touches matching files. Workflows live in .claude/skills/ and load only when invoked.
HTML comments like this one are stripped before Claude sees the file.
-->

# Working agreement (Claude Code)

## How to work with me

- I review plans before code. For any task ID (FE-/BE-/SEC-/QA-/DATA-/INFRA-), start with
  `/plan-task <ID>` in plan mode and wait for approval before editing files.
- Implement in small, verifiable steps. After each step: run the narrowest relevant check,
  report what changed, and stop if something contradicts the task spec, an ADR, or a contract.
- If sources conflict, do not invent a compromise: name the conflict and propose the doc/ADR fix.
- Ask before: adding a dependency, changing a public API/data contract, editing an ADR,
  touching `infra/`, CI workflows, or anything under `.github/`.
- Never commit, push, tag, or create PRs unless I ask in this session.
- When I ask for a commit that includes new or changed task specs (e.g. a new milestone), follow
  `/commit-tasks`: run `npm run plane:sync -- <IDs>` first so the Plane ids are written into the
  task files, then commit. No `Co-Authored-By` trailer.
- PR bodies are never left as the raw template: use `/open-pr [ID]` (fills task, lane, version,
  checklist from the task file and diff; lists manual steps such as the `render-preview` label and
  `ci` green under "Manual before merge"). See `docs/workflows/delivery-lanes.md` "PR body".
- Answer briefly. Lead with the result, then file paths. No recap of steps I watched you do.

## Commands (root, npm workspaces, Node 24)

- Web: `npm run lint:web`, `npm run type-check:web`, `npm run test:web`, `npm run e2e:mocks`
- Marketing: `npm run lint:marketing`, `npm run type-check:marketing`, `npm run test:marketing`
- API: `npm run lint:api`, `npm run type-check:api`, `npm run test:api`,
  `npm run openapi:generate` after controller/DTO changes
- Plane: `npm run plane:sync:dry` (always dry-run first), `npm run plane:sync`;
  specific tasks: `npm run plane:sync -- FE-040 BE-025`
- Prefer the narrowest command (single workspace, single spec file) over full suites.
  Delegate long/noisy runs to the `test-runner` subagent so logs stay out of the main context.

## Where things are

- Task specs: `docs/tasks/<area>/<ID>-*.md` (index: `docs/tasks/00-master-task-list.md`,
  conventions: `docs/tasks/README.md`)
- Roadmap crosswalk: `docs/roadmap/release-roadmap.md`
- Capability registry: `docs/product/` + `docs/marketing/capability-matrix.md` (lockstep)
- ADRs: `docs/decisions/`; contracts: `docs/contracts/`; architecture: `docs/architecture/`
- Process prompts (source for skills): `docs/processes/prompts/`
- Next.js in this repo is newer than training data: read `node_modules/next/dist/docs/`
  before using unfamiliar Next APIs (see `apps/web/AGENTS.md`).

## Do not read unless needed

- `CHANGELOG.md` (44 KB): read only the top entry when bumping the version.
- `package-lock.json`, `tsconfig.tsbuildinfo`, `coverage/`, `playwright-report/`,
  `test-results/`, `.next/`, `apps/api/openapi/openapi.json` (generated).
- `docs/archive/`: historical only.

## Skills in this repo

`/plan-task <ID>` · `/new-task <description>` · `/implement-task <ID>` ·
`/open-pr [ID]` · `/design-brief <ID>` · `/create-html-preview <ID>` · `/close-milestone <M#>` · `/plane-sync [IDs]` · `/commit-tasks`

## Compact instructions

When compacting, keep: the active task ID, the approved plan and which stages are done,
files changed so far, failing test names, open questions. Drop: file dumps and full logs.
