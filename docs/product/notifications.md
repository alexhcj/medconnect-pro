---
id: notifications
type: capability-module
name: Notifications
area: notifications
status: partial
claim: "In-app inbox, mark-read, and channel preferences for the session user. Not push, SMS, or email carriers."
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
    demo: Nest notification domain plus appointment create/cancel/delete producers
    public: no
    related_tasks: [BE-008, BE-012]
  - id: notifications.notification-center
    name: In-app notification center
    status: shipped
    demo: Header Bell inbox, mark-read, and channel preferences for the session user; not push/SMS/email carriers
    public: qualified
    planned_next: push, SMS/email carriers, Redis
    related_tasks: [DATA-002, BE-012, FE-025]
---

# Notifications

Backend domain HTTP shipped in [BE-008](../tasks/backend/BE-008-notification-domain.md). Live
appointment create, cancel, and delete enqueue in-app rows
([BE-012](../tasks/backend/BE-012-notification-producers.md)). The authenticated app presents a
self-scoped in-app inbox from the dashboard Bell
([FE-025](../tasks/frontend/FE-025-notifications-ui.md)). It is not push, SMS, or email delivery.

There is no `/platform/notifications` page.

| ID | Name | Status | Demo | Public |
| --- | --- | --- | --- | --- |
| `notifications.domain-http` | Notification domain HTTP | shipped | Nest domain plus appointment producers | no |
| `notifications.notification-center` | In-app notification center | shipped | Bell inbox, mark-read, and channel preferences; not push/SMS carriers | qualified |
