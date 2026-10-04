---
id: notifications
type: capability-module
name: Notifications
area: notifications
status: partial
claim: "Nest notification domain HTTP exists. Do not present a notification center as shipped."
related_tasks: [BE-008, DATA-002, BE-012, FE-025]
related_docs:
  - ../01-product-requirements.md
  - ../marketing/capability-matrix.md
  - ../roadmap/post-mvp-baseline.md
  - ../roadmap/frontend-roadmap.md
  - ../roadmap/release-roadmap.md
capabilities:
  - id: notifications.domain-http
    name: Notification domain HTTP
    status: shipped
    demo: Nest notification domain; no wired UI
    public: no
    related_tasks: [BE-008, BE-012]
  - id: notifications.notification-center
    name: In-app notification center
    status: planned
    demo: UI unwired
    public: no
    planned_next: M10 FE-025 (seed DATA-002; producers BE-012)
    related_tasks: [DATA-002, BE-012, FE-025]
---

# Notifications

Backend domain HTTP shipped in [BE-008](../tasks/backend/BE-008-notification-domain.md). The
authenticated app does not present a notification center until **M10**
([FE-025](../tasks/frontend/FE-025-notifications-ui.md)). Public copy must not imply one.

There is no `/platform/notifications` page.

| ID | Name | Status | Demo | Public |
| --- | --- | --- | --- | --- |
| `notifications.domain-http` | Notification domain HTTP | shipped | Nest domain, UI unwired | no |
| `notifications.notification-center` | In-app notification center | planned | UI unwired | no |
