---
id: FE-022
type: task
area: frontend
feature: marketing
status: implemented
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
  file_url: "https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd?node-id=41-3"
  frame: "Security / Desktop 1440 (41:3)"
  status: approved
implementation:
  status: complete
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

- [x] `/security`, `/about`, and `/demo` match their approved frames
- [x] Demo continues to `/login` (`LOGIN_PATH`)
- [x] Copy does not over-claim compliance, OAuth, live video, or payments
- [x] Pages are keyboard-accessible with semantic landmarks
- [x] Layouts are usable at desktop, tablet, and mobile widths
- [x] Playwright covers those routes and demo → login

## Dependencies

- Blocked by: [FE-018](FE-018-design-system-and-visual-language.md) (`design.status: approved`)
- Blocks: [FE-023](FE-023-marketing-polish-and-product-visuals.md)
- Related: [FE-010](FE-010-mock-authentication-ui.md)
- Figma URL (approved):
  https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd?node-id=41-3
- Canonical frame: Security / Desktop 1440 (`41:3`)
- Desktop set: About (`41:7`), Demo (`41:11`)
- Layout frames: Security / Tablet 768 (`44:388`), Security / Mobile 390 (`44:455`);
  About / Tablet 768 (`44:522`), About / Mobile 390 (`44:584`);
  Demo / Tablet 768 (`44:646`), Demo / Mobile 390 (`44:690`)
- Login chrome (optional token mapping): Login chrome / Token mapping (`41:15`)
- Canvas: Security / About / Demo

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

- Implementation: Replaced FE-017 placeholders at `/security`, `/about`, and `/demo` with
  Figma-approved composed pages (`MarketingSecurity`, `MarketingAbout`, `MarketingDemo`) using
  FE-018 tokens, `MarketingHero`, `MarketingCtaBand`, `MarketingSection`, `Card`/`Button`, and
  shared status-card/callout primitives. Demo CTAs use `LOGIN_PATH`. Login chrome on `/demo` is a
  labeled placeholder until FE-023. Optional token mapping on `LoginForm` only.
- Tests: Vitest `marketing-security.test.tsx`, `marketing-about.test.tsx`,
  `marketing-demo.test.tsx`; Playwright marketing spec updated for new h1s, demo → login, and
  over-claim negatives.
- PR:
- Notes: Design approved on the shared Figma file
  https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd?node-id=41-3
  (Security / Desktop 1440 `41:3`; About `41:7`; Demo `41:11`; login chrome `41:15`).
  Tablet/mobile: Security `44:388` / `44:455`, About `44:522` / `44:584`,
  Demo `44:646` / `44:690`. Version 0.49.0 → 0.50.0 (MINOR, new public UI).
