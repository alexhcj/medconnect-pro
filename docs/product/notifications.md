---
id: notifications
type: capability-module
name: Notifications
area: notifications
status: partial
claim: "Nest notification domain HTTP exists. Do not present a notification center as shipped."
related_tasks: [BE-008]
related_docs:
  - ../01-product-requirements.md
  - ../marketing/capability-matrix.md
  - ../roadmap/post-mvp-baseline.md
  - ../roadmap/frontend-roadmap.md
capabilities:
  - id: notifications.domain-http
    name: Notification domain HTTP
    status: shipped
    demo: Nest notification domain; no wired UI
    public: no
    related_tasks: [BE-008]
  - id: notifications.notification-center
    name: In-app notification center
    status: planned
    demo: UI unwired
    public: no
    planned_next: notifications UI (frontend Slice 2)
    related_tasks: []
---

# Notifications

Backend domain HTTP shipped in [BE-008](../tasks/backend/BE-008-notification-domain.md). The
authenticated app does not present a notification center. Public copy must not imply one.

There is no `/platform/notifications` page.

| ID | Name | Status | Demo | Public |
| --- | --- | --- | --- | --- |
| `notifications.domain-http` | Notification domain HTTP | shipped | Nest domain, UI unwired | no |
| `notifications.notification-center` | In-app notification center | planned | UI unwired | no |
