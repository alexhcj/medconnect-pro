### Flow

1. Name the closed milestone from docs/roadmap/release-roadmap.md
           ↓
2. Cursor audits listed tasks, contracts, and repository join
           ↓
3. Cursor classifies each finding (closed / still this milestone / later / out of scope)
           ↓
4. You review the gap list
           ↓
5. Cursor authors only the missing this-milestone task specs (after approval)
           ↓
6. Update roadmap crosswalk, Current position paragraph, the `AGENTS.md` "Current:" line,
   relevant roadmap slice, master task list, and matching
   `docs/product/` capability rows (plus the marketing capability matrix) when user-facing
   status or public claims changed; re-audit `apps/marketing/src/components/marketing/*-copy.ts`
   against the matrix, set the matrix "Last synced release" line, run `npm run docs:marketing-sync`
           ↓
7. After you declare the milestone closed: recapture stale product screenshots and update every
   place that uses them (see "Screenshot refresh")

This is not a substitute for [plan-mode-prompt.md](plan-mode-prompt.md). That file plans one task.
This file audits a finished milestone. Its output is a gap list and, at most, new task specs. It
does not produce an implementation plan. When authoring gap task specs, follow
[generate-new-task-prompt.md](generate-new-task-prompt.md).

---

Audit milestone close for M17.

Before proposing work:

1. Read the milestone sentence and crosswalk row in `docs/roadmap/release-roadmap.md`. List every
   mapped task ID.
2. Read those task files (status, scope, acceptance criteria, completion notes),
   `docs/tasks/00-master-task-list.md`, and the matching slices in `docs/roadmap/frontend-roadmap.md`
   and `docs/roadmap/backend-roadmap.md`.
3. Read the product requirements, [docs/product/](../../product/README.md) catalog for that
   domain, contracts, architecture, and ADRs.
4. Use `docs/archive/technical-implementation-tasks-v0.md` only as historical split notes. Treat it
   as oldest and not current. Use it to spot work dropped while dividing phases into small tasks.
   If a later milestone already owns that work, say so; do not pull it backward.
5. Inspect the repository for the join the milestone claims. Task checkboxes and `status:
   implemented` are not enough. For a UI-plus-API milestone, confirm the browser calls the Nest
   routes with the real session, that response DTOs map onto the UI types, and that seed or create
   data makes the screen demonstrable.

Classify every finding into exactly one bucket. Support each with repository evidence:

* **Closed** — listed on the milestone, `implemented`, and the claimed vertical slice exists in the
  repo.
* **Still this milestone** — both sides exist (or the milestone sentence requires them) and the
  slice is not connected, not demonstrable, or has no task. Propose a new task ID here only. Do not
  reopen implemented tasks.
* **Already owned later** — present in requirements, archive, or completion notes, and already
  mapped to a later milestone or existing task. Name that task and milestone. Do not open a new
  task.
* **Explicitly out of this milestone** — named in requirements or the archive, then left out of
  the milestone sentence or an implemented task's out-of-scope notes.

Propose new task files only for **Still this milestone**. For each proposed task, specify:

* Suggested ID (next free ID in that area)
* Objective and scope
* Dependencies
* Acceptance criteria
* Index updates (`release-roadmap.md` crosswalk, the relevant roadmap slice,
  `docs/tasks/00-master-task-list.md`, matching `docs/product/` rows, and
  `docs/marketing/capability-matrix.md` when claims change)

Preserve later-milestone boundaries. Do not invent DELETE routes, clinical subresources, document
upload, audit persistence, or a full authorization matrix when those already have later tasks.

If the milestone crosswalk, master list, and shipped code disagree, report the conflict before
proposing a new task.

**The audit is planning only. Do not modify files, install dependencies, or implement changes.**
The only exception is "Screenshot refresh" below, and only after I declare the milestone closed
and approve its stale-screenshot list.

## Screenshot refresh

Run after I declare the milestone closed. Skip screens that did not change (saves time and tokens).

Inventory (`apps/marketing/public/marketing/`; route prefix `apps/web/src/app/`):

| Image | App route | Owning paths (besides shared components and seed data) |
| --- | --- | --- |
| `login.png` | `/login` | `(auth)/login` |
| `dashboard.png` | `/dashboard` | `(dashboard)/dashboard/page.tsx` |
| `patients.png` | `/dashboard/patients` | `(dashboard)/dashboard/patients` |
| `appointments.png` | `/dashboard/appointments` | `(dashboard)/dashboard/appointments` |
| `telehealth.png` | `/dashboard/telehealth` | `(dashboard)/dashboard/telehealth` |
| `billing.png` | `/dashboard/billing` | `(dashboard)/dashboard/billing` |
| `admin.png` | `/dashboard/admin` | `(dashboard)/dashboard/admin` |
| `og.png` | dashboard crop, 1200x630 | same as `dashboard.png` |

1. **Detect.** For each image, `git log --oneline <last capture commit>..HEAD -- <owning paths>
   apps/web/src/components apps/web/src/lib apps/api/src/persistence` (seed data lives under
   `persistence`; add the screen's API module, e.g. `apps/api/src/billing`). List images whose UI, copy or demo seed content changed, each with the commits as
   evidence. Ask me to approve the list before capturing.
2. **Recapture** only the approved images from the running app with synthetic data (built-in
   browser, desktop 1440 px, same crop and viewport as the existing PNG, no dev tools or debug
   controls, no PHI). Overwrite the same filenames so most references need no change. Keep
   `og.png` in sync with `dashboard.png`. Open each new PNG to check it.
3. **Update every place the images apply.** Grep each filename and the old alt text, then check:
   - `README.md` Screenshots section: alt text and the intro sentence if wording is now wrong;
   - `apps/marketing/src/components/marketing/marketing-product-visuals.ts`: `alt`, `label`,
     caption, OG alt;
   - tests asserting `src`/`alt` (`marketing-product-image.test.tsx`,
     `feature-page-layout.test.tsx`);
   - `docs/marketing/capability-matrix.md` and `docs/product/` rows when a screenshot now shows or
     no longer shows a claimed capability (lockstep, claims never exceed the matrix);
   - Figma proof frames and `designs/marketing/*.pen` (listed in FE-023): do not regenerate
     (ADR-011); report them as stale.
4. **Verify.** `npm run lint:marketing`, `npm run test:marketing`, `npm run type-check:marketing`.
5. **Report.** Images recaptured, references updated (`path:line`), references intentionally
   left (Figma), and screens skipped as unchanged. Bump version and `CHANGELOG.md` only if a
   public claim changed, per `.claude/rules/versioning.md`.

End with:

1. Milestone sentence and listed tasks
2. Closed
3. Still this milestone (proposed tasks)
4. Already owned later
5. Explicitly out of this milestone
6. Blockers/open questions
7. Index updates if new tasks are approved (include `docs/product/` when claims or
   user-facing status would change)
8. Stale screenshots: images whose screens changed this milestone (evidence commits), for
   approval before the refresh
