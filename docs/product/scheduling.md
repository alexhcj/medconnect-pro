---
id: scheduling
type: capability-module
name: Scheduling
area: scheduling
marketing_path: /platform/appointments
status: shipped
claim: "Calendar, appointments, and provider availability."
related_tasks: [FE-005, FE-006, FE-012, BE-004]
related_docs:
  - ../01-product-requirements.md
  - ../marketing/capability-matrix.md
  - ../roadmap/post-mvp-baseline.md
capabilities:
  - id: scheduling.calendar
    name: Browse the practice calendar
    status: shipped
    demo: calendar views in the authenticated app
    public: yes
    related_tasks: [FE-006, FE-012]
  - id: scheduling.appointments
    name: Create and review appointments
    status: shipped
    demo: appointment create and list against Nest
    public: yes
    related_tasks: [FE-005, FE-012, BE-004]
  - id: scheduling.provider-availability
    name: Book against provider availability
    status: shipped
    demo: availability as implemented in the demo
    public: yes
    related_tasks: [FE-005, FE-006, BE-004]
  - id: scheduling.waitlist-check-in
    name: Waitlist and check-in / check-out
    status: planned
    demo: not in the demo
    public: no
    related_tasks: []
---

# Scheduling

Public path is `/platform/appointments` (not `/platform/scheduling`). Appointments can link to
the telehealth session shell; that is not live video.

| ID | Name | Status | Demo | Public |
| --- | --- | --- | --- | --- |
| `scheduling.calendar` | Browse the practice calendar | shipped | calendar views | yes |
| `scheduling.appointments` | Create and review appointments | shipped | create and list | yes |
| `scheduling.provider-availability` | Book against provider availability | shipped | as implemented | yes |
| `scheduling.waitlist-check-in` | Waitlist and check-in / check-out | planned | not in the demo | no |
