---
id: FE-057
type: task
area: frontend
feature: design-system
status: implemented
priority: medium
estimate: 5
dependencies: [ FE-018, FE-056 ]
related_adrs: [ ]
related_docs:
  [
    ../../architecture/frontend-architecture.md,
    ../../architecture/security-architecture.md,
    ../../contracts/data-contracts.md,
    ../../workflows/design-requirements.md,
    FE-056-app-form-pages-surface-parity.md,
  ]
design:
  required: true
  tool: figma
  file_url: "https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd/MedConnect-Pro-Design-System?node-id=426-2"
  frame: "FE-057 Date field & picker (page; node-id=426-2): components 426-3 (Date field 426-90, Calendar day 428-47, Calendar popover 428-48, Time option 428-181, Time listbox 428-182, Date time field 428-287), Add patient DOB 429-120, Schedule appointment 429-291, Admin filters 429-388, Mobile DOB sheet 430-394, Mobile appointment 430-547, notes 431-507"
  status: approved
implementation:
  status: complete
validation:
  responsive: true
  accessibility: true
  tests_required: true
plane:
  work_item_id: 4fe4e3f2-5ebd-4a4f-86b1-d6bd33566c87
  identifier: MEDCONNECT-149
---

# FE-057 — US date format and accessible date picker

## Objective

Every date and time the web app shows or accepts uses one US English format and looks the same in
every browser and OS language. Native date inputs are replaced by an accessible design-system date
field with a calendar popover.

## Context

Native `date` / `datetime-local` inputs and default-locale formatting follow the browser's language,
not the page `lang="en"`. A Russian browser shows `дд.мм.гггг` in inputs and `10.08.2026` in lists,
which clashes with the English-only app and marketing site. HTML has no supported way to force the
native input format.

Current state:

- Default-locale formatting: `components/appointments/appointment-list.tsx`,
  `components/appointments/appointment-event-dialog.tsx`,
  `components/telehealth/telehealth-appointment-linkage.tsx`,
  `components/session/concurrent-session-dialog.tsx`, `lib/admin/format.ts`,
  `lib/billing/format.ts` (`formatInvoiceDate`).
- Raw ISO display: date of birth on `components/patients/patient-profile.tsx` (`1970-01-01`).
- Already English: `appointment-calendar.tsx` and `lib/appointments/calendar-events.ts`
  (`date-fns` `enUS`), billing currency (`'en-US'`), notification relative times (`formatDistance`).
- Native inputs: `components/forms/patient-form.tsx` (date of birth, `date`),
  `components/forms/appointment-form.tsx` (start/end, `datetime-local`),
  `components/admin/list-filter-fields.tsx` (`date`).
- Dependencies: `date-fns` ^4.1 and `@headlessui/react` ^2.2; no date picker. Figma has a
  `Filter field` Date variant but no calendar component.

## Scope

- Shared formatters in `apps/web/src/lib/format/date.ts`, fixed to `en-US`: date `MM/DD/YYYY`
  (`08/10/2026`), long date `Aug 10, 2026` where a list already reads better that way, time
  `h:mm a` (`7:00 PM`), date-time and time ranges (`08/10/2026, 7:00 PM – 7:30 PM`). One function
  per kind, used everywhere.
- Replace every default-locale call listed above and format the patient profile date of birth.
- Date-only values (date of birth, filter dates) format without a UTC conversion, so they never
  show the previous day.
- `DateField` in `components/ui/`: text field with an `MM/DD/YYYY` mask and a calendar button that
  opens a month-grid popover; min/max, disabled and error states; form value stays `YYYY-MM-DD`
  (schemas and API unchanged); built on the FE-056 field style.
- `DateTimeField` for appointments: `DateField` plus a time selector (15-minute steps,
  `h:mm AM/PM`); value stays the local ISO string the appointment schema expects.
- Use the new fields for date of birth, appointment start and end, and admin date filters.
- Figma (shared file): date field states (empty, filled, focus, error, disabled), calendar popover (today, selected,
  disabled, keyboard focus), time selector, mobile layout; existing tokens only.

## Out of Scope

- Translation or support for other languages.
- Per-user locale or time-zone settings.
- API or contract changes.
- The marketing site (no dynamic dates).
- Restyling the appointment week/month calendar (already English).

## Requirements

- No date shown in the web app depends on the browser or OS language. No default-locale
  `toLocale*` calls and no native date inputs remain.
- Times show in the viewer's local time zone with a short zone label (for example `PDT`) where an
  appointment or session time is shown (decision 1).
- Accessibility (WCAG 2.2 AA):
    - visible label linked to the field; format hint (`MM/DD/YYYY`) linked as its description;
    - typing always works without the calendar;
    - calendar button has an accessible name ("Choose date, selected date is August 10, 2026");
    - popover is a labelled dialog; the month grid uses grid roles with full date names per cell,
      `aria-selected` for the selected day and `aria-current="date"` for today;
    - keyboard: arrows move by day/week, PageUp/PageDown by month (Shift for year), Home/End to week
      start/end, Enter/Space select, Escape closes and returns focus to the button;
    - focus moves into the grid on open; a live region announces month changes; visible focus at
      3:1 or better;
    - errors in text (not colour alone) and linked with `aria-describedby`;
    - targets at least 24×24 px (44 px preferred on mobile); works at 320 px width and 200% zoom.
- Privacy (HIPAA-oriented patterns, not a compliance claim):
    - date of birth and appointment times are treated as health data;
    - no date-of-birth or appointment date values in URLs, query strings, or analytics; no `console`
      logging of field values (audit/security filter dates stay in the URL and API query as FE-043
      shipped them; decision 4);
    - no third-party scripts, CDN calls, or external fonts; a new library must be bundled;
    - `autoComplete="bday"` only on date of birth;
    - demo data stays synthetic.
- A new library is allowed only if it is accessible, MIT/ISC licensed, maintained, tree-shakeable,
  and bundled with no network calls. Decision 2 picks `react-day-picker` v9 (with the existing
  `date-fns`); confirm the exact version with the user before installing.

## Acceptance Criteria

- [x] With the browser set to Russian, German, or English (US or UK), every date in patients,
  appointments, telehealth, billing, admin, notifications, and session dialogs reads as
  `MM/DD/YYYY` or the defined US long form, and times read as `h:mm AM/PM`.
- [x] Date of birth shows the stored day in a US time zone; a unit test covers the UTC-shift case.
- [x] No native `type="date"`, `datetime-local`, or `time` inputs remain; patient, appointment, and
  admin filter fields use `DateField` / `DateTimeField`.
- [x] Dates can be typed (masked) or picked; invalid or out-of-range dates show a text error;
  values sent to the API keep their current format.
- [x] The calendar meets the keyboard, screen-reader, and focus requirements above (axe plus a
  manual keyboard pass) and works at 320 px and 200% zoom.
- [x] No date values appear in URLs, logs, or third-party requests (network panel check).
- [x] Figma frames are approved before implementation, and the implementation matches them.
- [x] Unit tests cover formatters, mask/parse logic, and calendar keyboard behaviour; e2e specs for
  the patient form, appointment form, and admin filters pass.

## Dependencies

- FE-018 design tokens.
- FE-056 shared field style (`components/forms/form-field-styles.ts`).
- Approved Figma design: https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd/MedConnect-Pro-Design-System?node-id=426-2
  (approved 2026-10-30; brief options accepted: bottom sheet below 640 px, typeable 15-minute time
  combobox, Today-only footer with Clear on optional fields, End = Start + 30 min pending a schema
  check, inline zone label, strikethrough min/max days).

## Validation

- `npm run lint:web`, `npm run type-check:web`, `npm run test:web`.
- `npm run e2e:mocks` for patient-form, appointment-form, administration, billing-dashboard, and
  telehealth-session.
- Manual: Chrome and Firefox with the browser language set to Russian; axe scan of the open popover;
  keyboard-only pass; 320 px and 200% zoom.

## Risks / considerations

- Time zone: the API stores ISO date-times. Local time with a zone label is the smallest change,
  but viewers in different zones see different clock times.
- Native date inputs give mobile users the OS wheel picker for free; the custom field must stay
  comfortable on touch screens.
- The appointment schema may expect the `datetime-local` string; convert values carefully.
- Expected MINOR bump (new public UI: `DateField` / `DateTimeField`).

## Decisions

Resolved by the user on 2026-10-30 (recommended options accepted):

1. Time zone: the viewer's local time zone with a short zone label (for example `PDT`) on
   appointment and session times. No practice time-zone field and no API change.
2. Library: `react-day-picker` v9 for the month grid, styled with design-system tokens and bundled (no CDN). Confirm the
   exact version before installing.
3. Lists: `MM/DD/YYYY` in fields and tables; the long form (`Aug 10, 2026`) only where a list
   already uses it (calendar toolbar titles).

Plan decisions, approved by the user on 2026-10-30 (recommended options accepted):

4. Privacy scope (B1): the "no date values in URLs or query strings" rule covers date of birth and
   appointment values. Audit/security filter dates stay in the URL and API query as FE-043 shipped
   them (not patient data). The Figma admin-frame note is corrected to match.
5. Library version (B2): `react-day-picker@9.14.0`, pinned exactly; install approved. No package
   stylesheet or CDN; styled with Tailwind token classes.
6. Invoice dates (O1): `issuedAt` / `dueAt` (UTC midnight) format as the UTC calendar day.
7. End auto-fill (O2): End = Start + 30 min only when End is empty or not after the new Start.
8. Admin range error (O3): keep the existing copy "The end date must be on or after the start date."
9. Date of birth (O4): no month/year dropdowns; typing is primary, Shift+PageUp/PageDown jumps a
   year (matches Figma).
10. Lint guard (O5): add an ESLint rule in `apps/web` that bans `toLocale*String` calls.
11. Admin filter UTC day bounds (O6): out of scope; unchanged.

## Completion

- Implementation: `lib/format/date.ts` (fixed `en-US` formatters: date, UTC calendar day, date-only,
  long date-only, time, short/long zone, date-time, range) and `lib/format/date-input.ts` (mask,
  parse with min/max, text error messages, 15-minute time options, typed-time parse, local
  date-time helpers). New `components/ui/calendar.tsx` (react-day-picker 9.14.0, token classes, no
  package stylesheet), `date-field.tsx`, `time-field.tsx` (Headless UI combobox) and
  `date-time-field.tsx`. Call sites switched: appointment list and event dialog, telehealth
  linkage, concurrent-session dialog, `lib/admin/format.ts`, `lib/billing/format.ts` (UTC day),
  patient profile date of birth. Patient form uses `DateField` (`max` today, `autoComplete="bday"`);
  appointment form uses `DateTimeField` with End = Start + 30 min when End is empty or not after
  Start; admin `DateField` wraps the UI field (URL behaviour unchanged, decision 4). ESLint rule
  bans `toLocale*String` in `apps/web/src`. `vitest.setup.ts` stubs `ResizeObserver` for Headless UI.
  Version 0.100.1 -> 0.101.0 (MINOR: new public UI components; no API or contract change).
- Tests: Vitest 711 passed (new: `date.test.ts`, `date-input.test.ts`, `date-field.test.tsx`,
  `date-time-field.test.tsx`; updated form, profile, appointment list, billing format and audit
  viewer tests). `npm run lint:web` 0 errors (9 existing warnings, none in changed files);
  `npm run type-check:web` clean. New e2e `date-format.spec.ts` (13 tests: `ru-RU` browser in a Los
  Angeles zone for profile, appointments, billing, admin and telehealth; no native date inputs;
  calendar keyboard and Escape focus return; axe on the open calendar; End auto-fill; 15-minute list
  with disabled earlier times; no date values in URL, storage, console or external requests; admin
  range; 320 px reflow and bottom sheet). Full `e2e:mocks` run: 51 passed, 8 `auth-marketing-link`
  failures because it reused a dev server without `NEXT_PUBLIC_MARKETING_URL`; those 8 plus
  `appointment-form` and `date-format` then passed on a fresh Playwright server (25 passed).
- Browser (mock preview): typed and picked date of birth, keyboard select with focus return,
  appointment Start/End layout, and the 375 px bottom sheet checked against the Figma frames.
- Deviations: outside-month days use `color/text/muted` instead of the placeholder grey (axe found
  2.5:1 on clickable days); the Figma "Calendar day" component was updated to match. Controls keep
  the FE-056 form height (`h-10`, 40 px) beside sibling fields; Figma frames show 44 px. Desktop
  calendar uses a 36–40 px nav/day size; 44 px on the mobile sheet.
- Not verified (left unticked): German and English (UK) browsers and Firefox were not run (only
  `ru-RU` in Chromium; formatting does not read the browser locale); notifications use the existing
  English relative times and session dialogs are covered by unit tests only; manual screen-reader
  pass and 200% zoom were not done; the user has not yet reviewed the implementation against the
  Figma frames.
- Follow-up check (2026-10-31, mock preview, Chromium): `ru-RU`, `de-DE`, `en-US` and `en-GB`
  browsers in a Los Angeles zone show only `MM/DD/YYYY` / `h:mm AM/PM` on the patient profile and
  edit pages, appointment calendar, event dialog and list, telehealth list and waiting room, billing
  list and invoice, and admin tables. Notifications show English relative times. The concurrent-session
  dialog cannot open in mocks (one session), so it stays unit-tested only; Firefox was not run. The
  user accepted the first criterion on that evidence. The keyboard pass, axe scans and the 320 px / 200% zoom checks
  found three calendar defects, fixed at 0.103.6: Enter/Space on the calendar button opened on
  today instead of the field's month (the month was set in `onClick`, which Headless UI does not
  fire for keys; the grid now reads `defaultMonth` on mount); today lacked `aria-current="date"`;
  at 200% zoom on a 1280×800 window the height-limited popover hid the focused day (the panel now
  scrolls itself, never the page). Admin filter calendar buttons got distinct names. All other
  keyboard, labelling, live-region, focus-ring (3.68:1), target-size and axe checks passed. The user
  confirmed the Figma match.

## Roadmap

M21 (moved from standalone on 2026-10-30). Ships before INFRA-021.
