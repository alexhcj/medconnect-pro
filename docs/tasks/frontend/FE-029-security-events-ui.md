---
id: FE-029
type: task
area: frontend
feature: administration
status: pending
priority: medium
estimate: 2
dependencies: [FE-016, BE-015]
related_adrs: [ADR-011-figma-canonical-visual-source.md]
related_docs:
  [
    ../../architecture/frontend-architecture.md,
    ../../contracts/api-endpoints.md,
    ../../product/administration.md,
    ../../marketing/capability-matrix.md,
    ../../workflows/design-requirements.md,
    FE-016-administration-ui-nest-api.md,
    FE-026-role-assignment-ui.md,
    ../backend/BE-015-security-events-http.md,
  ]
design:
  required: true
  tool: figma
  file_url: ""
  frame: ""
  status: not_started
implementation:
  status: not_started
validation:
  responsive: true
  accessibility: true
  tests_required: true
plane:
  work_item_id: 6f651eb2-2b70-475c-8464-a23a2e54f47b
  identifier: MEDCONNECT-84
---

# FE-029 — Security-events UI

## Objective

Add a thin administration viewer for Nest `GET /admin/security-events` next to the existing
audit viewer, without merging the two lists.

## Context

[FE-016](FE-016-administration-ui-nest-api.md) connected the audit viewer to Nest.
[FE-026](FE-026-role-assignment-ui.md) parked security-events UI on M11. HTTP is
[BE-015](../backend/BE-015-security-events-http.md). Capability
`administration.security-events-http` is `planned`.

Implements / extends `administration.security-events-http`.

**Do not implement application code until `design.status` is `approved` on this task.**

## Scope

- Design on this task (shared Figma file, extend App / Administration), then implementation
- Live client for `GET /admin/security-events`
- Mock fixture so mock mode remains demonstrable
- Loading, empty, and error states (including 403)
- Distinct from the audit list (not a silent filter on the same table UI)
- Keep user directory, role assignment, and audit viewer working
- When shipped: catalog `administration.security-events-http` → `shipped` / `public: qualified`;
  capability-matrix administration planned cell no longer “Security-events HTTP remains M11”

## Out of Scope

- Session-policy editor
- MFA policy administration
- Cookie session cutover (FE-027)
- Role PATCH changes (FE-026)
- Permission-matrix editor
- User create/invite/delete

## Requirements

### UI / design

- Extend existing `/dashboard/admin`; do not invent a second administration information
  architecture
- Shared Figma file: https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd
- States: default, loading, empty, error
- Accessible heading and list; errors use `role="alert"`
- Repeat the approved Figma URL in Dependencies when design is approved

### Technical

- Frontend checks remain UX only; Nest is authoritative
- No client `practiceId` authorization
- Mock Playwright stays on mocks

## Acceptance Criteria

- [ ] `design.status` is `approved` with `file_url` and `frame` before implementation
- [ ] PRACTICE_ADMIN can open security events on `/dashboard/admin` in live mode
- [ ] Audit viewer still loads
- [ ] 403 and empty states map to accessible UI (no silent success)
- [ ] Catalog + capability matrix describe security-events HTTP as shipped with tenant limits
      (not a session-policy editor)

## Dependencies

- FE-016 (shipped), BE-015
- Design brief via [design-brief-prompt.md](../../processes/prompts/design-brief-prompt.md) on
  **this** task

Shared Figma file: https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd

## Validation

- Vitest for live list mapping and error/empty states
- `npm run e2e:live` administration check that security events load
- Keyboard access to the viewer

## Risks / Considerations

- Do not present the viewer as a full SIEM or HIPAA audit export.
- Nav visibility is not authorization.

## Implementation notes

Suggested order: after BE-015. May run in parallel with FE-027 / FE-028. Design must be
approved on this task before implementation.

Writing this spec is not a version bump. Design-metadata approval is not a version bump.
Shipping this slice is **MINOR**.

## Completion

- Implementation:
- Tests:
- PR:
- Notes:
