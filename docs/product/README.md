# Product capability registry

Statused catalog of **user-facing product capabilities**. This is the missing middle layer
between the complete-product vision and engineering tasks.

- **Canonical for:** what the product is, at user-outcome grain, and how it may be described.
- **Not canonical for:** whether work is done (tasks + code), sequencing (roadmaps), or
  architecture (ADRs). Milestone snapshot remains
  [post-mvp-baseline.md](../roadmap/post-mvp-baseline.md).
- **Public-claim ceiling:** [capability-matrix.md](../marketing/capability-matrix.md) is a
  marketing view of this registry plus infrastructure rows that are not product modules.

Do not Plane-sync these IDs. Do not treat them as task IDs (`FE-007`, `BE-006`, …). Do not
generate marketing pages, dashboard nav, or roadmaps from this folder until a later, explicit
workflow exists.

## Source-of-truth position

1. ADRs
2. [Product requirements](../01-product-requirements.md) — complete-product **target**
3. **This registry** — statused catalog
4. Architecture / contracts
5. Tasks
6. Roadmaps
7. Code

[01-product-requirements.md](../01-product-requirements.md) stays the unstatused vision. Status
lives here. If this registry and the marketing matrix disagree, fix them together; YAML in these
files wins for catalog status.

## Schema

One Markdown file per module. YAML front matter holds the structured registry. The Markdown
table is a reading copy and must stay in lockstep with `capabilities`.

```yaml
---
id: telehealth                    # matches filename without .md
type: capability-module
name: Telehealth
area: telehealth                  # task `feature:` slug when one exists
marketing_path: /platform/telehealth  # omit when there is no public page
status: partial                   # shipped | partial | planned | out_of_scope
claim: "Appointment-linked session shell. Not live video."
related_tasks: [FE-007, FE-014, BE-006]
related_docs:
  - ../01-product-requirements.md
  - ../marketing/capability-matrix.md
  - ../roadmap/post-mvp-baseline.md
capabilities:
  - id: telehealth.start-session  # {module}.{slug} — never FE-/BE-/TELE-001
    name: Start a virtual visit from an appointment
    status: shipped
    demo: create, join, and end a session shell from an appointment
    public: qualified             # yes | qualified | no
    planned_next: live media (Daily / WebRTC)
    related_tasks: [FE-007, FE-014, BE-006]
---
```

### Status (product, not Plane)

| Value | Meaning |
| --- | --- |
| `shipped` | Demonstrable in the app (mock and/or live Nest as documented). |
| `partial` | Present with an honest limit (session shell, invoice list, mock cards). |
| `planned` | In product requirements or a later roadmap; do not imply it ships now. |
| `out_of_scope` | Labeled limit of this demo (HIPAA certification, hosted production). |

Do not use `in_progress`. That belongs on tasks (`implementation.status`). This catalog describes
what a visitor or interviewer can see **today**.

`public` is the marketing allowance: `yes` (accurate as named), `qualified` (must carry the
`claim` / `demo` limit), `no` (do not present as a shipped product surface).

## Modules

| Module | Status | Marketing | File |
| --- | --- | --- | --- |
| Identity and access | partial | `/login`, `/security` | [identity-access.md](identity-access.md) |
| Patient management | shipped | `/platform/patient-management` | [patient-management.md](patient-management.md) |
| Scheduling | shipped | `/platform/appointments` | [scheduling.md](scheduling.md) |
| Telehealth | partial | `/platform/telehealth` | [telehealth.md](telehealth.md) |
| Billing | partial | `/platform/billing` | [billing.md](billing.md) |
| Analytics | partial | `/platform/analytics` | [analytics.md](analytics.md) |
| Notifications | partial | none | [notifications.md](notifications.md) |
| Administration | partial | `/platform/administration` | [administration.md](administration.md) |
| Security | shipped | `/security` | [security.md](security.md) |

CI, Amplify, ECS, and hosted production are **not** product modules. Their claim rules stay on
the [capability matrix](../marketing/capability-matrix.md).

Do not backfill every bullet in product requirements. Add a capability when a task ships it or
when marketing needs a named planned/boundary item. Grain: a few user outcomes per module, not
every engineering slice.

## When to update

- **Task complete:** if the slice changes a user-facing capability, update that row (`status`,
  `demo`, `public`, `planned_next`, `related_tasks`).
- **New task spec:** link `related_tasks` to existing capability IDs. Do not invent a parallel
  `TELE-001` family. Do not invent product language the registry does not support.
- **Milestone close:** reconcile this folder against listed tasks and the repository. The
  marketing matrix must still match.

No application version bump for registry-only edits. Bump when a public claim or shipped UX
changes, per [versioning.md](../workflows/versioning.md).
