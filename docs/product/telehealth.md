---
id: telehealth
type: capability-module
name: Telehealth
area: telehealth
marketing_path: /platform/telehealth
status: partial
claim: "Appointment-linked session shell. Not live video."
related_tasks: [FE-007, FE-014, BE-006]
related_docs:
  - ../01-product-requirements.md
  - ../marketing/capability-matrix.md
  - ../roadmap/post-mvp-baseline.md
capabilities:
  - id: telehealth.start-session
    name: Start a virtual visit from an appointment
    status: shipped
    demo: create, join, and end a session shell from an appointment
    public: qualified
    planned_next: live media (Daily / WebRTC)
    related_tasks: [FE-007, FE-014, BE-006]
  - id: telehealth.waiting-room
    name: Waiting room
    status: partial
    demo: waiting-room placeholders in the session shell
    public: qualified
    related_tasks: [FE-007, FE-014]
  - id: telehealth.live-media
    name: Live video, camera, and screen sharing
    status: planned
    demo: not in the demo
    public: no
    planned_next: Daily / WebRTC, signaling
    related_tasks: []
  - id: telehealth.chat-recording
    name: In-session chat, recording, and transcription
    status: planned
    demo: not in the demo
    public: no
    related_tasks: []
---

# Telehealth

Create, join, and end an appointment-linked session shell. Waiting-room placeholders are part
of the shell. Do not claim live video, Daily, WebRTC, chat, or recording.

| ID | Name | Status | Demo | Public |
| --- | --- | --- | --- | --- |
| `telehealth.start-session` | Start a virtual visit from an appointment | shipped | create / join / end shell | qualified |
| `telehealth.waiting-room` | Waiting room | partial | placeholders | qualified |
| `telehealth.live-media` | Live video, camera, and screen sharing | planned | not in the demo | no |
| `telehealth.chat-recording` | In-session chat, recording, and transcription | planned | not in the demo | no |
