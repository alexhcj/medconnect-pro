---
id: telehealth
type: capability-module
name: Telehealth
area: telehealth
marketing_path: /platform/telehealth
status: partial
claim: "Appointment-linked session shell with demo Daily media when configured. Not production telehealth or HIPAA video."
related_tasks: [FE-007, FE-014, BE-006, BE-016, FE-030]
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
    planned_next: in-session chat and recording
    related_tasks: [FE-007, FE-014, BE-006]
  - id: telehealth.waiting-room
    name: Waiting room
    status: shipped
    demo: pre-join waiting room; after Nest join, presence wait until a remote Daily participant (or labeled unavailable)
    public: qualified
    related_tasks: [FE-007, FE-014, FE-030]
  - id: telehealth.live-media
    name: Live video, camera, and screen sharing
    status: shipped
    demo: Daily call-object camera, microphone, and screen share when DAILY_API_KEY is set; labeled unavailable when it is not; mock mode keeps placeholders
    public: qualified
    planned_next: chat, recording, transcription
    related_tasks: [BE-016, FE-030]
  - id: telehealth.chat-recording
    name: In-session chat, recording, and transcription
    status: planned
    demo: not in the demo
    public: no
    related_tasks: []
---

# Telehealth

Create, join, and end an appointment-linked session shell. Live mode uses a Daily custom call
object when the API has `DAILY_API_KEY`; otherwise the shell labels media unavailable. Mock mode
keeps placeholders. Do not claim production telehealth, HIPAA-certified video, chat, or recording.

| ID | Name | Status | Demo | Public |
| --- | --- | --- | --- | --- |
| `telehealth.start-session` | Start a virtual visit from an appointment | shipped | create / join / end shell | qualified |
| `telehealth.waiting-room` | Waiting room | shipped | pre-join plus presence wait | qualified |
| `telehealth.live-media` | Live video, camera, and screen sharing | shipped | Daily call object when configured | qualified |
| `telehealth.chat-recording` | In-session chat, recording, and transcription | planned | not in the demo | no |
