---
id: FE-022
type: task
area: frontend
feature: marketing
status: pending
priority: high
estimate: 3
dependencies: [FE-018]
related_adrs: [ADR-011-figma-canonical-visual-source.md, ADR-003-authentication.md]
related_docs:
  [
    frontend-architecture.md,
    security-architecture.md,
    ../01-product-requirements.md,
    ../../00-project-spec.md,
    ../../roadmap/post-mvp-baseline.md,
    ../../roadmap/release-roadmap.md,
    ../../workflows/design-requirements.md,
    ../../marketing/requirements.md,
    ../../marketing/sitemap.md,
    ../../marketing/capability-matrix.md,
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
  work_item_id: 4c8103ef-6d4f-469a-a1b6-fbcb1d28bbad
  identifier: MEDCONNECT-57
---

# FE-022 — Security, About, and Demo pages

## Objective

Replace the remaining FE-017 placeholders at `/security`, `/about`, and `/demo` with
portfolio-quality pages that explain implemented controls, project context, and how to enter the
demo.

## Context

Placeholder routes already exist and `/demo` already links to `LOGIN_PATH` (`/login`).
[FE-018](FE-018-design-system-and-visual-language.md) supplies the shared visual system. Login
behavior stays [FE-010](FE-010-mock-authentication-ui.md); this task may align login chrome to
tokens only.

Do not start UI implementation while `design.status` is not `approved`. Use the same Figma file as
FE-018. Repeat the Figma URL in Markdown Dependencies.

## Scope

- **Security:** implemented controls and principles from
  [security-architecture.md](../../architecture/security-architecture.md) (mock IdP, RBAC, tenant
  isolation, audit, RLS, document ACL). Explicitly not HIPAA-certified.
- **About:** project purpose, architecture, and portfolio context from
  [00-project-spec.md](../../00-project-spec.md).
- **Demo:** safe exploration and walkthroughs; continue to existing `/login`; no new identity
  stack.
- Optional: login chrome token alignment only (FE-010 behavior unchanged).

## Out of scope

- Rewriting `/privacy-policy` and `/terms-of-service` (they remain outside marketing chrome and
  still claim HIPAA — known inconsistency, not this task)
- New auth, OAuth, or a second demo entry mechanism
- Feature pages (FE-021)
- Deploy/preview

## Requirements

- Copy follows [capability-matrix.md](../../marketing/capability-matrix.md) and
  [post-mvp-baseline.md](../../roadmap/post-mvp-baseline.md).
- WCAG 2.1 AA-oriented; desktop, tablet, and mobile.
- Public marketing routes; `/login` remains in `(auth)`.
- Synthetic demo data only.

## Technical constraints

- Follow the project architecture.
- Do not invent a new authentication mechanism.
- Do not claim HIPAA certification, production OAuth, live video, or hosted payments.
- Reuse FE-018 tokens and `MarketingShell`.

## Acceptance criteria

- [ ] `/security`, `/about`, and `/demo` match their approved frames
- [ ] Demo continues to `/login` (`LOGIN_PATH`)
- [ ] Copy does not over-claim compliance, OAuth, live video, or payments
- [ ] Pages are keyboard-accessible with semantic landmarks
- [ ] Layouts are usable at desktop, tablet, and mobile widths
- [ ] Playwright covers those routes and demo → login

## Dependencies

- Blocked by: [FE-018](FE-018-design-system-and-visual-language.md) (`design.status: approved`)
- Blocks: [FE-023](FE-023-marketing-polish-and-product-visuals.md)
- Related: [FE-010](FE-010-mock-authentication-ui.md)
- Figma URL (fill when approved):
- Frame (fill when approved):

## Validation

Browser check of the three routes. Existing marketing Playwright demo → login plus content
assertions that avoid over-claim language. Lint, type-check, and frontend tests.

## Risks / considerations

- `/privacy-policy` and `/terms-of-service` can contradict qualified marketing copy until a later
  follow-up.
- Do not describe mock identity as production OAuth.

## Implementation notes

Keep routes at `apps/web/src/app/(marketing)/security/page.tsx`, `about/page.tsx`, and
`demo/page.tsx`. Demo must keep using `LOGIN_PATH`.

## Completion

- Implementation:
- Tests:
- PR:
- Notes:
