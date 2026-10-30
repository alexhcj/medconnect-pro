---
id: FE-056
type: task
area: frontend
feature: design-system
status: implemented
priority: medium
estimate: 3
dependencies: [FE-018]
related_adrs: []
related_docs:
  [
    ../../architecture/frontend-architecture.md,
    ../../workflows/design-requirements.md,
    FE-018-design-system-and-visual-language.md,
    FE-024-live-dashboard-overview.md,
    FE-040-responsive-header-logo-and-role-tag-parity.md,
    FE-041-billing-design-code-sync.md,
  ]
design:
  required: true
  tool: figma
  file_url: "https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd/MedConnect-Pro-Design-System?node-id=418-2"
  frame: "FE-056 Form surface parity (page; node-id=418-2): Add patient 418-3, Edit patient 418-132, Schedule appointment 418-261, Mobile Add patient 418-323, Telehealth waiting room 418-460, notes 418-470"
  status: approved
implementation:
  status: complete
validation:
  responsive: true
  accessibility: true
  tests_required: true
plane:
  work_item_id: 768dbe75-fd17-4e83-85c3-876237333b37
  identifier: MEDCONNECT-148
---

# FE-056 — App page surface parity

## Objective

Every dashboard page uses one visual pattern: content sits on a minimal white surface with a
visible border on the gray page canvas. Add patient, Edit patient, and Schedule appointment stop
looking different from the rest of the app.

## Context

The dashboard shell (`apps/web/src/components/dashboard/dashboard-shell.tsx`) paints every page
`bg-gray-50`. List and detail pages (Patients, Patient profile) wrap content in the shared `Card`
(`bg-surface`, `border-border`). The form pages render a bare `<form>` on the canvas
(`components/forms/patient-form.tsx`, `components/forms/appointment-form.tsx`), and their shared
`inputClassName` uses `bg-transparent`, so fields read gray on gray. The loading, error, and
no-access states on `patients/new`, `patients/[patientId]/edit`, and `appointments/new` are already
white bordered panels, so only the loaded form is out of line.

The same pattern must hold across the app (telehealth, billing, admin, appointments, dashboard
overview), not only on the three reported pages.

## Scope

- Patient form (create and edit modes) and appointment form render inside the shared `Card`.
- Form controls (input, select, date/datetime, textarea) get an explicit white background and a
  visible border. Extract the duplicated `inputClassName` (two forms plus the inline textarea copy
  in `appointment-form.tsx`) into one shared class or reuse the `ui/input` styles.
- Align every dashboard page to the same surface pattern: `dashboard/page.tsx` (overview),
  `patients/*`, `appointments/*`, `telehealth/*` (lobby, waiting room, session shell), `billing/*`,
  and `admin/*`. Replace raw `bg-white` / `bg-gray-*` panels and ad-hoc borders with `Card` or the
  surface and border tokens where they play the role of a content surface.
- Figma: one frame per affected page group (patient form, appointment form, plus any page whose
  surface changes) updated on this task.

## Out of Scope

- Shell, sidebar, or header redesign.
- Changing the gray page canvas colour.
- Marketing site (`apps/marketing`, M21).
- Auth pages (`(auth)` layout, FE-050).
- Form behaviour, validation, field order, copy, and API calls.
- Intentional non-surface fills (telehealth media tiles, skeleton loaders, status badges).
- Dark mode.

## Requirements

- Use existing tokens and components (`Card`, `bg-surface`, `border-border`); no new colours or
  hardcoded hex values.
- One surface pattern: white surface, 1 px token border, existing radius and shadow from `Card`.
- Loading, error, empty, and no-access states use the same surface as the loaded content.
- Focus rings, control height, labels, and error text unchanged.
- No horizontal scroll at 375 px; padding inside the card stays usable on long forms.

## Acceptance Criteria

- [x] Add patient, Edit patient, and Schedule appointment render their form inside a white bordered
      surface that matches the Patients list and Patient profile.
- [x] Inputs, selects, date fields, and textareas show a white background and a visible border.
- [x] Loading, error, and no-access states on those pages match the loaded form surface.
- [x] Dashboard overview, appointments, telehealth, billing, and admin pages use the same surface
      pattern; Completion lists each page checked and whether it changed or was already consistent.
- [x] No content surface in `apps/web/src/app/(dashboard)` or its components visually mismatches
      the white bordered surface (no gray-on-gray content panels). Existing white bordered
      loading / error / no-access panels may stay hand-built and are listed in Completion;
      intentional non-surface fills are named there too.
- [ ] Layout holds at 375, 768, and 1280 px with no horizontal scroll; text, borders, and focus
      rings meet WCAG AA contrast.
- [x] Existing form and page tests pass; a test asserts the patient and appointment forms render
      inside the card surface.

## Dependencies

- FE-018 design system and tokens.
- Approved Figma design: https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd/MedConnect-Pro-Design-System?node-id=418-2
  (FE-056 Form surface parity page). Approved decisions: one `Card` per form; white fields;
  `color/border/input` unchanged (contrast is a follow-up); card padding 24 px from 768 px, 16 px
  at 375 px; waiting room uses the lobby's white card; loading / error / no-access panels keep the
  existing white bordered treatment.

## Validation

- `npm run lint:web`, `npm run type-check:web`, `npm run test:web` (form and page specs).
- `npm run e2e:mocks` for create patient, edit patient, and schedule appointment.
- Screenshots of each affected page beside the Patients page at 375 / 1280 px.

## Risks / considerations

- Wrapping forms in `Card` changes padding and width; check long forms on mobile.
- The app-wide sweep can grow; keep changes to surface classes only and record anything bigger as a
  follow-up.
- Expected PATCH bump (UI fix, no API or contract change).

## Completion

- Implementation: new `apps/web/src/components/forms/form-field-styles.ts` (one shared control style,
  `border-input bg-surface`, and the form card padding `p-4 sm:p-6`). `patient-form.tsx` (create
  and edit) and `appointment-form.tsx` render title, note, form alert, sections and submit inside
  one `Card`; the duplicated `inputClassName` and the inline notes textarea style are gone.
  `telehealth/waiting-room.tsx` uses `Card` instead of the gray panel; `billing/invoice-detail.tsx`
  Details and Line items sections sit in `Card` (semantic `<section>` kept inside).
  Version 0.100.0 -> 0.100.1 (PATCH: UI fix, no API or contract change).
- Tests: `patient-form.test.tsx` and `appointment-form.test.tsx` assert the card surface and white
  fields. Vitest for forms, telehealth, billing and dashboard routes: 108 passed. `npm run lint:web`
  0 errors (9 existing warnings, none in changed files); `npm run type-check:web` clean.
  `npm run e2e:mocks -- patient-form appointment-form telehealth-session billing-dashboard
  patient-profile`: 16 passed.
- Browser (mock preview): Add patient, Schedule appointment, waiting room and invoice detail show the
  white bordered card; fields compute `rgb(255, 255, 255)` with `rgb(209, 213, 219)` borders. No
  horizontal scroll at 375, 768 and 1280 px; card padding 16 px at 375 and 24 px from 768.
- Sweep (pages checked):

  | Page | Result |
  |---|---|
  | Dashboard overview | Consistent (stats `Card`; error panel white bordered) |
  | Patients list, Patient profile | Consistent (`Card`) |
  | Add / Edit patient | Changed (form in `Card`, white fields) |
  | Appointments list / calendar | Consistent (`Card`) |
  | Schedule appointment | Changed (form in `Card`, white fields) |
  | Telehealth lobby | Consistent (`Card`) |
  | Telehealth session / waiting room | Changed (waiting room gray panel to `Card`) |
  | Billing list, claims boundaries | Consistent (`Card`) |
  | Invoice detail | Changed (Details and Line items in `Card`; same look plus card shadow) |
  | Administration | Consistent (`Card` lists; state panels white bordered) |

- Kept as approved: hand-built white bordered loading / error / no-access / left-call panels (for
  example `dashboard/page.tsx`, `admin/page.tsx`, `billing/page.tsx`, `patients/new/page.tsx`,
  `telehealth-session-shell.tsx`, `admin-list-states.tsx`). Intentional non-surface fills kept:
  telehealth media tiles (`daily-media-session.tsx`, `media-placeholders.tsx`) and gray skeleton
  loaders. The shell canvas stays `bg-gray-50` (same value as `--color-bg-canvas`).
- Not met / deviation: the responsive and AA criterion stays unticked. Text and the blue focus ring
  pass on white, but `--color-border-input` (#d1d5db) is about 1.5:1 on white, below the 3:1 non-text
  target. Leaving the token unchanged was an approved design decision (it affects every input in
  the app); raise it as a follow-up token task.

## Roadmap

M21 (moved from standalone on 2026-10-30, after shipping at 0.100.1).
