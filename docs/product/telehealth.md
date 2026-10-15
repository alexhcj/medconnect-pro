---
id: telehealth
type: capability-module
name: Telehealth
area: telehealth
marketing_path: /platform/telehealth
status: partial
claim: "Appointment-linked session shell with demo Daily media when configured. Not production telehealth or HIPAA video."
related_tasks: [FE-007, FE-014, BE-006, BE-016, FE-030, BE-021, FE-035, BE-024, FE-038]
related_docs:
  - ../01-product-requirements.md
  - ../marketing/capability-matrix.md
  - ../roadmap/post-mvp-baseline.md
capabilities:
  - id: telehealth.start-session
    name: Start a virtual visit from an appointment
    status: shipped
    demo: create, join, leave the call, and end a session shell from an in-window appointment
    public: qualified
    planned_next: portal patient and assigned nurse can enter an open visit (M18); then in-session chat and recording
    related_tasks: [FE-007, FE-014, BE-006, BE-021, FE-035, BE-024, FE-038]
  - id: telehealth.waiting-room
    name: Waiting room
    status: shipped
    demo: pre-join waiting room with optional camera/mic check; after Nest join, presence wait until a remote Daily participant (or labeled unavailable)
    public: qualified
    related_tasks: [FE-007, FE-014, FE-030, FE-035]
  - id: telehealth.live-media
    name: Live video, camera, and screen sharing
    status: shipped
    demo: Daily call-object camera, microphone, and screen share when DAILY_API_KEY is set; labeled unavailable when it is not; leave tears down Daily without ending the visit; ended and ineligible visits stay closed; mock mode keeps placeholders
    public: qualified
    planned_next: chat, recording, transcription
    related_tasks: [BE-016, FE-030, BE-021, FE-035]
  - id: telehealth.participant-entry
    name: Second participant enters an open visit
    status: planned
    demo: not in the demo; lobby Join visit calls create, which patients and nurses cannot do
    public: no
    planned_next: lookup of the open session, then the existing join
    related_tasks: [BE-024, FE-038, DATA-005]
  - id: telehealth.chat-recording
    name: In-session chat, recording, and transcription
    status: planned
    demo: not in the demo
    public: no
    related_tasks: []
---

# Telehealth

Create, join, leave the call, and end an appointment-linked session shell. Live mode uses a Daily
custom call object when the API has `DAILY_API_KEY`; otherwise the shell labels media unavailable.
Leaving the call does not end the visit. Ended or ineligible sessions stay closed. Mock mode keeps
placeholders. A second participant cannot enter from the lobby yet; that entry is planned
(M18) and is not in the demo. Do not claim production telehealth, HIPAA-certified video, chat,
or recording.

| ID | Name | Status | Demo | Public |
| --- | --- | --- | --- | --- |
| `telehealth.start-session` | Start a virtual visit from an appointment | shipped | create / join / leave / end shell | qualified |
| `telehealth.waiting-room` | Waiting room | shipped | pre-join device check plus presence wait | qualified |
| `telehealth.live-media` | Live video, camera, and screen sharing | shipped | Daily call object when configured; leave vs end | qualified |
| `telehealth.participant-entry` | Second participant enters an open visit | planned | not in the demo | no |
| `telehealth.chat-recording` | In-session chat, recording, and transcription | planned | not in the demo | no |
