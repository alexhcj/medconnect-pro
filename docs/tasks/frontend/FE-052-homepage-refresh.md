---
id: FE-052
type: task
area: frontend
feature: marketing
status: implemented
priority: high
estimate: 5
dependencies: [FE-019, FE-023, FE-051, QA-012]
related_adrs: [ADR-011-figma-canonical-visual-source.md]
related_docs:
  [
    ../../marketing/capability-matrix.md,
    ../../marketing/requirements.md,
    ../../workflows/design-requirements.md,
    FE-019-marketing-homepage.md,
    FE-051-marketing-design-system-extension.md,
  ]
design:
  required: true
  tool: figma
  file_url: "https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd/MedConnect-Pro-Design-System?node-id=319-297"
  frame: "Homepage / Desktop 1440 (FE-052) (319:297), Tablet 768 (FE-052) (321:622), Mobile 390 (FE-052) (321:947)"
  status: approved
implementation:
  status: complete
validation:
  responsive: true
  accessibility: true
  tests_required: true
plane:
  work_item_id: 299a72b0-6d8d-4c3e-add0-9fc2dbb1e17a
  identifier: MEDCONNECT-143
---

# FE-052 — Homepage refresh

## Objective

At every width the homepage reads as distinct, scannable sections. The hero gets a product visual,
the practice modules get icons and links, the slider becomes clearer, and the principles sections
stay compact on mobile and laptop.

## Context

- Every homepage section sits on the same white background as a card grid.
- UX and Security principles share one 3-column card grid. It stacks into tall cards on mobile and
  narrow three-column rows at about 1024 px.
- The hero is text only.
- Figma's tablet and mobile homepage frames have drifted from the code: old module copy and no
  workflow section.
- `designs/marketing/homepage-alt-1.pen` is the layout reference for the hero, module icons, slider
  and security split. Its copy is not used.

## Scope

- **Section order and bands**:
  1. Hero (surface)
  2. Practice modules (surface)
  3. Connected workflow (canvas)
  4. Product UI (surface)
  5. Security principles (canvas, split)
  6. UX principles (surface, card grid)
  7. Who it is for (surface)
  8. CTA (surface band; the existing rounded `MarketingCtaBand` card inside the container)
- **Band spacing**: when two bands of the same tone meet, the second one drops its top padding. The
  exception is Hero → Practice modules, which keeps the full gap.
- **Hero**: two columns from `lg`, with the fresh dashboard screenshot and two overlay chips built
  from existing claims ("RBAC and tenant isolation", "Synthetic data only"). At `md` the image sits
  below the CTAs; below `md` it is hidden.
- **Practice modules**: icons that match the app sidebar (Users, Calendar, Video, CreditCard,
  LayoutDashboard for Analytics, Shield). Each card is a `MarketingLinkCard` to `/platform/<slug>`.
- **Product UI slider**: restyled after alt-1. Baseline: a larger single slide, module chips acting
  as tabs, prev/next and an "n / 6" counter. Scroll-snap, keyboard support and the carousel ARIA
  stay.
- **Security principle cards**: each security item is a non-interactive card (surface background,
  1px border, `rounded-lg`, 40px brand-subtle icon tile, title, description) at every width. Below
  `md` the padding and icon tile are smaller.
- **Security principles**: `MarketingSplitSection`. The intro reuses the `/security` hero body, and
  the link goes to `/security`. Five items: the existing three (Mock identity, RBAC and tenant
  isolation, Audit events) plus "PostgreSQL RLS" and "Document ACL", copied verbatim from
  `MARKETING_SECURITY_CONTROLS` (icons: KeyRound, ShieldCheck, ScrollText, Database, FileLock).
- **UX principles**: the current layout kept. The heading sits above a wrapping grid of the
  existing three cards (title and description, no icons). There are 3 columns from `lg` and 2
  columns from `md`, where the third card sits alone on the last row. Below `md` it is one card per
  row. The `/create-html-preview` variants were not chosen.
- **Who it is for**: a heading, an intro, and six role cards (icon, role name, scope line). From
  `md` they form a 3-column grid. Below `md` they are 2-column one-line tiles (icon and role name),
  with the scope line hidden. Other pages keep `RoleTag` pills.
- **Mobile density** (below `md`, matching the approved 390 frame): module link cards, workflow
  step cards, security cards and UX cards use 16px padding (`p-4`, Figma `spacing/4`) instead of
  24px. The security icon tile is 32px. Role tiles use 10px padding, a 28px icon tile and the
  `Label/Sm` name style. This stays on the 4px spacing scale
  ([frontend-architecture.md](../../architecture/frontend-architecture.md)). Link cards keep their
  44px minimum height.
- **Figma**: Homepage frames at 1440, 768 and 390 rebuilt from components.

## Approved new copy

Role copy is new. It describes each role's default scope as it currently works: the dashboard nav
role groups in `apps/web/src/lib/navigation/dashboard-nav.ts` and the role table in
[identity-and-access.md](../../contracts/identity-and-access.md). Under
[ADR-016](../../decisions/ADR-016-super-admin-session-tenant-scope.md), `SUPER_ADMIN` HTTP is scoped
to the session practice, so no line claims cross-practice access. The Patient line states the
role's scope only and does not describe a patient portal product. The capability matrix
Authentication row allows role-scope lines like this one.

- Section intro: "Each role sees only the modules and records its permissions allow. Synthetic demo
  accounts only."

| Role | Icon | Scope line |
| --- | --- | --- |
| Practice admin | Briefcase | Users, role assignment, audit viewer, and billing for the practice. |
| Provider | Stethoscope | Patients, appointments, telehealth, and practice invoices. |
| Nurse | HeartPulse | Assigned patients, appointments, and telehealth. |
| Receptionist | CalendarCheck | Patient demographics, scheduling, and invoices. |
| Patient | User | Own appointments, telehealth visits, and invoices only. |
| Super admin | Shield | Every module, scoped to the signed-in practice. |

If a role's nav group or contract scope changes, update this table and the copy file together.

## Out of Scope

- New marketing claims or copy beyond the "Approved new copy" section and the two security items
  reused from `/security`. The hero chips and the Security split intro reuse existing text. UX
  principles has no intro and no split.
- Changes to other pages.

## Requirements

- All other copy stays as it is, and every visible claim is allowed by `capability-matrix.md`.
- No horizontal scroll at 375, 768, 1024, 1280 or 1440 px.
- The hero image has meaningful alt text and doesn't delay LCP of the heading. Don't lazy-load the
  visible text, and size the image so it causes no layout shift.
- The slider stays keyboard-operable, with visible focus and an accessible label for each slide.
- `prefers-reduced-motion` turns smooth scrolling off.

## Acceptance Criteria

- [x] Sections render in the order and band tones listed above.
- [x] The hero shows the screenshot and both chips at 1024 px and up, the screenshot alone at 768 px,
      and neither at 375 px.
- [x] Every practice module card shows its icon and opens the matching `/platform/<slug>` page.
- [x] Security principles are two columns from 1024 px, with five icon cards at every width.
- [x] UX principles show three text-only cards in a grid: 3 columns at 1024 px and up, 2 at 768 px
      (the third card alone on the second row), and 1 per row at 375 px.
- [x] "Who it is for" shows the intro and six role cards with the approved scope lines from `md`,
      and 2-column icon-and-name tiles below `md`.
- [x] The role copy matches the "Approved new copy" table, and a unit test checks it.
- [x] The slider has module chips, a counter and prev/next, works by keyboard, and announces the
      current slide.
- [x] The Figma homepage frames (1440/768/390) match the implementation.

## Dependencies

- Blocked by: FE-051, QA-012. Related: FE-019, FE-023.
- Design (approved): Figma file
  https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd/MedConnect-Pro-Design-System?node-id=319-297.
  The frames are on the Homepage page: `Homepage / Desktop 1440 (FE-052)` (319:297),
  `Tablet 768 (FE-052)` (321:622) and `Mobile 390 (FE-052)` (321:947). The older homepage frames are
  marked `[STALE — superseded by FE-052]`. New components on the Components page: `Icon/*` (Lucide),
  `Principle row`, `Icon button`, `Workflow step`, and `Role card` (Card and Row layouts). Pencil
  reference `designs/marketing/homepage-alt-1.pen` (layout only).

## Validation

- Run `npm run lint:marketing`, `type-check:marketing`, `test:marketing` and the marketing e2e.
- Screenshot the preview at all five widths.
- Do a keyboard pass through the hero, module cards and slider.

## Risks / considerations

- An over-decorated hero can look cheap. Use no invented metrics and no stock imagery, and build the
  chips from existing claims.
- The slider must not lose accessibility. Keep the existing region and `aria-roledescription`.

## Completion

- Implementation:
  - `marketing-home.tsx`: eight `MarketingBand` sections in the scoped order and tones. Roles and
    CTA take `pt-0 sm:pt-0 lg:pt-0`, because each follows a surface band.
  - `marketing-home-copy.ts`:
    - Module `href`s and hero `chips`.
    - Security `intro`, `link` and items. "PostgreSQL RLS" and "Document ACL" come from
      `MARKETING_SECURITY_CONTROLS` through `securityControl()`, so the copy is never duplicated.
    - Role `{label, scope}` items and the roles intro (the approved table).
    - About keeps tags through `MARKETING_HOME_ROLES.items.map((role) => role.label)`.
  - `marketing-home-hero.tsx`: a 7/5 grid from `lg`.
    - `MarketingProductImage` of `dashboard.png` (1440×900, no layout shift) is `hidden md:block`.
    - The two chips are a labelled `<ul>`, `hidden lg:block`: a `Badge` in a bordered surface pill.
  - `marketing-home-modules.tsx`: `MarketingLinkCard` per module, with the sidebar icons
    (`aria-hidden`) and `p-4 md:p-6`.
  - `marketing-home-preview.tsx` and `marketing-product-ui-slider.tsx`:
    - Full-width slides, each `role="group"` with `aria-roledescription="slide"` and the label
      "n of 6: Module".
    - Chips in a labelled group, each with `aria-current` and 44px tall.
    - Prev/next (44px, disabled at the ends) around an `aria-hidden` "n / 6" counter.
    - A polite live region updated only on user moves.
    - `motion-safe:scroll-smooth` on the track, and `behavior: 'auto'` under reduced motion.
    - A pending-target ref so scroll sync does not undo a requested move mid-scroll.
    - The region, its label and the arrow keys are kept.
  - `marketing-home-security.tsx` (new): `MarketingSplitSection` (the `/security` intro and link)
    with five icon cards. The tile is 32px below `md` and 40px from `md`.
  - `marketing-home-principles.tsx`: UX text-only cards, `md:grid-cols-2 lg:grid-cols-3`, and
    `p-4 md:p-6`.
  - `marketing-home-roles.tsx`: heading, intro and six role cards (`grid-cols-2 md:grid-cols-3`).
    Below `md` the scope line is `hidden md:block`.
  - `marketing-home-workflow.tsx`: `p-4 md:p-6` card padding.
  - Screenshots: the QA-012 signed-in capture was re-run. Only `telehealth.png` changed.
  - Version 0.99.3 -> 0.99.4.
- Validation:
  - `lint:marketing`, `type-check:marketing` and `test:marketing` all pass (20 files, 91 tests).
    `marketing-home.test.tsx` covers:
    - band order and tones, and the collapsed padding;
    - the hero visual and chip breakpoints;
    - module hrefs and hidden icons;
    - five security cards, the intro and the link;
    - the UX grid classes;
    - the approved role copy;
    - the slide labels;
    - chips, prev/next and arrow keys, with announcements and disabled ends.
  - Marketing e2e: 5 passed.
  - Browser at 1440, 1280, 1024, 768 and 375 px:
    - No horizontal scroll at any width.
    - Hero image and chips at 1024+, the image only at 768, neither at 375.
    - Modules 3/3/3/2/1 columns, UX 3/3/3/2/1, roles 3/3/3/3/2 (scope line hidden at 375), and the
      Security split from 1024.
  - Keyboard: arrow keys on the focused carousel move a slide and announce
    "Slide 2 of 6: Appointments". Two quick next clicks land on slide 3 with the chip, counter and
    announcement in sync.
  - Screenshots were compared with the Figma frames:
    - 1440 (Security, UX, roles, CTA) with frame 319:297.
    - 768 (hero image below the CTAs with no chips; UX 2 columns with the third card alone; roles
      3 columns) with frame 321:622.
    - 375 (no hero image, full-width CTAs; roles as 2-column icon-and-name tiles; rounded CTA card)
      with frame 321:947.

    1280 and 1024 were measured (columns, overflow, hero visibility) but not screenshotted.
- Deviations:
  - The slider chips are 44px tall (the marketing touch-target rule). The Figma chips were resized
    from 36px to 44px to match.
  - The stale marketing e2e expectation for the Administration feature heading was updated to
    "Users, roles, and audit viewer". This was copy from 0.99.1 and is unrelated to the homepage,
    but it blocked the e2e run.
  - The hero image uses the default `next/image` loading. The `h1` stays the LCP candidate.
