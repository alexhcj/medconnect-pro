---
id: FE-026
type: task
area: frontend
feature: administration
status: implemented
priority: high
estimate: 2
dependencies: [FE-016, BE-013]
related_adrs: [ADR-011-figma-canonical-visual-source.md]
related_docs:
  [
    ../../architecture/frontend-architecture.md,
    ../../contracts/api-endpoints.md,
    ../../contracts/identity-and-access.md,
    ../../product/administration.md,
    ../../workflows/design-requirements.md,
    FE-016-administration-ui-nest-api.md,
    ../backend/BE-013-role-assignment-http.md,
  ]
design:
  required: true
  tool: figma
  file_url: "https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd"
  frame: "App / Administration — 01 Users list — default (desktop) (121:7)"
  status: approved
implementation:
  status: complete
validation:
  responsive: true
  accessibility: true
  tests_required: true
plane:
  work_item_id: ead57093-2cb6-453f-8da5-2326e8fc4431
  identifier: MEDCONNECT-79
---

# FE-026 — Role assignment UI

## Objective

Extend the existing administration user list so a practice admin can change a membership role
against Nest `PATCH /admin/users/:id/roles`.

## Context

[`user-role-list.tsx`](../../../apps/web/src/components/admin/user-role-list.tsx) is read-only.
FE-016 forbade role PATCH. Audit viewer stays as-is.

Implements / extends `administration.role-assignment`.

**Do not implement application code until `design.status` is `approved` on this task.**

## Scope

- Design on this task (shared Figma file), then implementation
- Role change control on the existing `/dashboard/admin` user list
- Live client for PATCH; mock equivalent so mock mode remains demonstrable
- Map 403/validation errors into accessible UI (cannot grant SUPER_ADMIN, last-admin protection)
- One `e2e:live` check: practice admin changes the seeded provider role and sees the new value
  (restore or use a dedicated assertion that does not strand later tests)
- Keep audit viewer; do not add security-events UI (M11)
- Update `docs/product/administration.md` and the capability-matrix administration row when
  shipped

## Out of Scope

- User create/invite/delete
- Permission-matrix editor
- `GET /admin/security-events`
- Notifications Bell (FE-025)
- Cookie session cutover
- Reopening FE-016, BE-010, or BE-013 beyond the live client

## Requirements

### UI / design

- Extend the existing admin user list; do not invent a second administration information
  architecture
- Shared Figma file: https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd
- States: default, submitting, success, error (including last-admin and forbidden grant)
- Accessible name on the role control; confirm destructive/last-admin cases if design requires
- Repeat the approved Figma URL in Dependencies when design is approved

### Technical

- Frontend checks remain UX only; Nest is authoritative
- Bearer live client; no client `practiceId` authorization
- Mock Playwright stays on mocks

## Acceptance Criteria

- [x] `design.status` is `approved` with `file_url` and `frame` before implementation
- [x] With mocks off, a PRACTICE_ADMIN can PATCH a membership role and the list shows the new
  role after success
- [x] Forbidden grants surface an error instead of a silent UI success
- [x] Audit viewer still loads
- [x] One non-mock browser check covers a successful role change for
  `practice.admin@example.test`
- [x] Catalog + capability matrix allow describing role assignment as shipped with tenant/grant
  limits (security-events still unshipped)

## Dependencies

- FE-016, BE-013
- Design brief via [design-brief-prompt.md](../../processes/prompts/design-brief-prompt.md) on
  **this** task

Figma (shared library; approved page **App / Administration**, primary frame
`01 Users list — default (desktop)` / `121:7`):
https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd?node-id=121-7

## Validation

- Vitest for live PATCH mapping and error handling
- `npm run e2e:live` administration extension
- Keyboard access to the role control

## Risks / Considerations

- Live e2e that changes `jordan.ellis@synthetic.example` can break later provider tests if not
  restored.
- Do not present frontend hiding of SUPER_ADMIN as the security control.

## Implementation notes

Suggested order: after BE-013. Design is approved on this task; implementation may proceed via
the plan-mode prompt.

Writing this spec is not a version bump. Design-metadata approval is not a version bump.

## Completion

- Implementation: Inline native role select on `/dashboard/admin`; live and mock
  `adminAPI.assignRole` against `PATCH /admin/users/:id/roles`; SUPER_ADMIN omitted from grant
  options (UX only); 403 last-admin / forbidden grant mapped to a per-row `role="alert"`.
- Tests: Vitest PATCH mapping, mock last-admin/SUPER_ADMIN 403s, labeled combobox, keyboard
  `selectOptions`; mock Playwright copy; `e2e:live` changes `jordan.ellis@synthetic.example`
  PROVIDER → NURSE and restores PROVIDER.
- PR:
- Notes: Version 0.65.0 → 0.66.0 (MINOR). Plane MEDCONNECT-79 is a human update. Live
  `e2e:live` requires Postgres, seed, and API on :3001.
