---
id: FE-058
type: task
area: frontend
feature: design-system
status: implemented
priority: medium
estimate: 3
dependencies: [FE-018, FE-056, FE-057]
related_adrs: []
related_docs:
  [
    ../../architecture/frontend-architecture.md,
    ../../workflows/design-requirements.md,
    FE-056-app-form-pages-surface-parity.md,
    FE-057-us-date-format-and-date-picker.md,
  ]
design:
  required: true
  tool: figma
  file_url: "https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd/MedConnect-Pro-Design-System?node-id=441-2"
  frame: "FE-058 Select & input parity (page; node-id=441-2): components Icon/ChevronDown 441:3, Select option 441:17, Select listbox 441:18, Select field 442:177 (Size Default/Compact × State Empty/Filled/Hover/Focus/Open/Error/Disabled); Add patient 443:29, Patient directory 443:137, Admin security events 443:173, User roles 443:250, Mobile 375 443:349, notes 443:502. Input 16:20 gained Hover/Focus; all input controls 40 px (size/control)."
  status: approved
implementation:
  status: complete
validation:
  responsive: true
  accessibility: true
  tests_required: true
plane:
  work_item_id: 33f546fb-ecfa-4d9e-b08d-477773a180f4
  identifier: MEDCONNECT-150
---

# FE-058 — Design-system select list and input parity

## Objective

Every select list and text input in the web app uses the design system. One accessible `SelectField`
with the Figma `Filter field` chevron replaces all native `<select>` elements, and text inputs share
one token-based style with the FE-056 / FE-057 fields.

## Context

FE-057 replaced native date inputs with design-system fields (calendar button, clock button, styled
option list). Native `<select>` elements still render the OS arrow and popup, ignore design tokens,
and differ between browsers, so they look unfinished beside the new fields.

Current state:

- Native `<select>` in five places, four different class strings:
  - `components/admin/list-filter-fields.tsx` (`SelectField`, local `controlClass`, `text-gray-900`);
  - `components/admin/user-role-list.tsx` (role per table row, `h-11`, `text-gray-900`);
  - `components/forms/appointment-form.tsx` and `components/forms/patient-form.tsx`
    (`formControlClassName` from FE-056);
  - `components/patients/patient-list.tsx` (status and sort; `border-gray-300`, `bg-transparent`,
    `ring-blue-500`).
- Text inputs: `components/ui/input.tsx` (`h-11`, `bg-transparent`, ring offset) differs from the
  FE-056 `formControlClassName` (`h-10`, `bg-surface`, `ring-blue-500`); labels beside the
  patient-list search and filters use `text-gray-700` instead of `text-foreground-label`.
- Control heights are mixed: `h-10` (40 px) in `formControlClassName`, `DateField`, `TimeField`
  and `DateTimeField`; `h-11` (44 px) in `ui/input.tsx`, the admin `SelectField` and admin
  `DateField` (`controlClassName="h-11"` in `list-filter-fields.tsx`), the patient-list selects and
  the user-table role select. The `DateField` / `TimeField` icon buttons grow to `size-11` (44 px)
  below 640 px, wider than a 40 px field.
- Figma: the `Filter field` component (used in frames 429-120 and 429-291) already has an
  `icon/chevronDown` (16 px) layer. There is no chevron-up and no open-list or state set for it.
- `@headlessui/react` ^2.2 is already a dependency (`Listbox`); `lucide-react` has
  `ChevronDown` / `ChevronUp`.

## Scope

- `SelectField` in `components/ui/`, built on Headless UI `Listbox`: trigger in the shared field
  style, chevron toggle at the right (down when closed, up when open), option list styled like the
  FE-057 `TimeField` list (`rounded-lg`, `shadow-lg`, focus and selected states, `Check` on the
  selected option). Default and compact (table row: narrower, label screen-reader-only on desktop)
  variants, both 40 px high. Works with React Hook Form and with controlled values.
- One control height for every input type, in code and Figma: 40 px (`h-10`, Figma
  `size/control`) for text, search, select (including the table role select), date and date-time
  fields. Remove the `h-11` overrides listed above. The `DateField` / `TimeField` icon buttons stay
  inside the field at every width (no `max-sm:size-11`); buttons keep their own sizes.
- Replace all five native `<select>` call sites. Keep the admin filter URL fallback (a URL value not
  in the curated list still shows as selected) and the role select's pending, saved, error and
  `md:sr-only` label behaviour.
- One text-input style: align `components/ui/input.tsx` and `formControlClassName` on the same
  height, background, border, focus ring, placeholder, disabled and error tokens; switch the
  patient-list and user-role-list search inputs and their labels to tokens (no `gray-*` classes).
- ESLint rule in `apps/web` that bans raw `<select>` JSX in `apps/web/src` outside
  `components/ui/select-field.tsx`, next to the FE-057 `toLocale*String` rule.
- Figma (shared file, existing tokens only): reuse the `Filter field` `icon/chevronDown`; add a
  chevron-up icon in the same style only if the open state needs a separate glyph; add a select
  field component with default, hover, focus, open, error and disabled states, the open option list,
  the compact table-row variant, and a 375 px frame. Align the `Input` component states with the
  shared input style.

## Out of Scope

- Textareas, radio buttons and checkboxes.
- The marketing site (no select lists).
- Searchable combobox, multi-select and grouped options.
- Changing option sets, form schemas, URL parameters or API contracts.
- Restyling the FE-057 date, time and calendar fields beyond the shared 40 px height.

## Requirements

- Form values, `register` bindings and URL filter behaviour stay the same.
- Accessibility (WCAG 2.2 AA):
  - visible label linked to the trigger; errors in text, linked with `aria-describedby` and
    `aria-invalid`;
  - keyboard: Enter, Space and Alt+↓ open; arrows, Home/End and type-ahead move; Enter selects;
    Escape closes and returns focus to the trigger;
  - chevron is decorative (`aria-hidden`); open state is exposed by `aria-expanded`;
  - focus ring 3:1 or better; targets at least 24×24 px (44 px preferred on mobile); works at 320 px
    width and 200% zoom.
- The option list is not clipped inside cards, filter bars or table rows (Headless UI anchoring) and
  flips above the trigger near the viewport bottom.
- Design tokens only: no hex values and no `gray-*` palette classes in the migrated controls.
- No new dependency and no external assets.

## Acceptance Criteria

- [x] No native `<select>` remains in `apps/web/src`; all five call sites use `SelectField`.
- [x] The ESLint rule fails on a raw `<select>` outside `components/ui/select-field.tsx`;
      `npm run lint:web` passes.
- [x] Trigger, chevron and open list match the approved Figma frames (default, hover, focus, open,
      error, disabled, compact).
- [x] The chevron points down when closed and up when open, and is hidden from assistive technology.
- [x] Keyboard and screen-reader behaviour meets the requirements above (axe on the open list plus a
      manual keyboard pass).
- [x] The user-table role select keeps its pending, saved and error states and its screen-reader-only
      label on desktop.
- [x] Admin filters still show a URL value that is not in the curated list as selected.
- [x] The list is not clipped in filter bars, form cards or table rows, and works at 320 px and 200%
      zoom.
- [x] Text inputs (`Input`, form fields, both search inputs) share one style; no `gray-*` classes
      remain in the changed files.
- [x] Every text, search, select, date and date-time control in `apps/web` renders 40 px high on
      desktop and mobile (no `h-11` on input controls); the field icon buttons do not overflow the
      field below 640 px.
- [x] Unit tests cover `SelectField` (selection, keyboard, URL-value fallback, disabled and error);
      affected form, administration, patient-list and role-list unit and e2e specs pass.

## Dependencies

- FE-018 design tokens.
- FE-056 shared field style (`components/forms/form-field-styles.ts`).
- FE-057 field patterns (`TimeField` option list, ESLint guard).
- Approved Figma design: https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd/MedConnect-Pro-Design-System?node-id=441-2
  (approved 2026-10-30; brief options accepted: chevron rotates 180° when open, reused from the
  `Filter field` `icon/chevronDown`; anchored list at all widths with 44 px option rows below
  640 px; selected = brand-subtle + medium + check; filter "All …" values as normal text, form
  placeholders in `text/placeholder`; `bg/surface` inputs; list width = trigger width, min 160 px;
  one 40 px control height, decision 1).

## Validation

- `npm run lint:web`, `npm run type-check:web`, `npm run test:web`.
- `npm run e2e:mocks` for patient-form, appointment-form, administration and patient-list specs.
- Manual: Chrome and Firefox; axe scan with a list open; keyboard-only pass; 320 px and 200% zoom.

## Risks / considerations

- Playwright specs that call `selectOption` on native selects need new selectors.
- The role select saves on change; listbox events and focus must keep that flow and its live status.
- Option lists inside scrolling tables and cards can clip; use anchored popovers.
- Changing `Input` height or background touches every page that uses it; check sign-in, register and
  admin pages for layout shifts.
- Buttons next to inputs (for example the `size="lg"` Search button in the user-role list) stay
  44 px; align them by the bottom edge or move them to the default button size.

## Decisions

Resolved by the user on 2026-10-30:

1. One control height: every input type (text, search, select, date, date-time) is 40 px in code
   and Figma (`size/control`). The Figma `Input`, `Filter field`, `User row` / `User card` role
   select, FE-057 `Date field` / `Date time field` and FE-058 `Select field` components were moved
   to 40 px; FE-058 implementation brings the code in line.
2. Login and MFA inputs (`components/auth/login-form.tsx`, `components/auth/mfa-challenge-form.tsx`;
   no height class today, about 38 px) are in scope and move to the shared 40 px field style
   (plan approval, 2026-10-30).

## Versioning

Expected MINOR bump (new public UI component `SelectField`).

## Completion

- Implementation: `components/ui/select-field.tsx` (Headless UI `Field` + `Listbox`; 40 px trigger,
  chevron turns when open, anchored list at the trigger width, check on the selected option, 44 px
  rows below 640 px; error and status linked through `Description`; Enter opens a closed list
  instead of submitting the form). Call sites: admin `SelectField` wrapper (URL-value fallback kept),
  patient and appointment forms (React Hook Form `Controller`), patient-list status and sort,
  user-table role select (compact, `md:sr-only` label, busy/disabled while saving, "Role updated"
  status). One input style: `formControlBaseClassName` gained text, placeholder, hover and disabled
  tokens; `Input`, login and MFA inputs use `formControlClassName` (40 px, white); admin date filter
  `h-11` override and the `max-sm:size-11` field icon buttons removed; user-table Search and Clear
  filters buttons at the default 40 px. Touched files use tokens instead of `gray-*` / `red-600`
  (same hex values). ESLint bans `JSXOpeningElement[name.name='select']` in `apps/web/src`.
  Version 0.101.0 -> 0.102.0 (MINOR: new public UI component; no API or contract change).
- Tests: Vitest 725 passed (new `select-field.test.tsx`, helper `src/test/select.ts`; 10 files moved
  off native selects). Playwright mocks 43 passed: new `e2e/select-field.spec.ts` (keyboard incl.
  type-ahead and Enter not submitting, axe with a list open, role list outside the table at trigger
  width, URL-value fallback, 40 px on login and five dashboard pages, 320 px reflow, icons inside
  fields, 44 px option rows) plus administration, appointment-form, billing-dashboard, patient-form,
  patients-list and date-format. `npm run lint:web` 0 errors (9 existing warnings);
  `npm run type-check:web` clean (includes `e2e/`).
- Browser (mock preview): Add patient selects at 40 px, keyboard select with focus return, linked
  error on submit; role change PROVIDER -> NURSE shows busy then "Role updated" (restored); open role
  list 256 px wide and on screen; every control 40 px on patients, appointments/new, admin, billing
  and login, and at 375 px on appointments/new.
- Deviations: placeholder text in the select trigger uses `text/muted` (#6b7280) instead of
  `text/placeholder`: it is real text, so axe requires 4.5:1 (placeholder grey is about 2.5:1). The
  Figma Select field Empty variants and the Add patient override were updated to match. Type-ahead is
  covered in e2e only (jsdom has no `innerText`).
- User verification (2026-10-30): implementation matches the approved Figma frames; 200% zoom
  approved; every input type is 40 px and lists are not clipped in filter bars. The MFA code input
  browser check was waived by the user (it uses the same `formControlClassName` as login).
- Not run: the three live-API specs (`administration-live`, `appointment-live`, `patient-live`) were
  updated but need the live API. Focus drops to the page after a role save because the trigger is
  disabled while saving (same as the native select before).

## Roadmap

M21 (added 2026-10-30). Shipped at 0.102.0, after FE-057 and before INFRA-021.
