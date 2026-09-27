---
id: SEC-004
type: task
area: security
feature: documents
status: implemented
priority: high
estimate: 3
dependencies: [BE-003,DATA-001]
related_adrs: [ADR-002-tenant-isolation.md, ADR-010-postgresql-typeorm.md]
related_docs: [security-architecture.md,data-architecture.md]
plane:
  work_item_id: 133d7958-36f5-4932-9055-8f678a4a09d4
  identifier: MEDCONNECT-40
---

# SEC-004 — Document access control

## Objective

Create secure document metadata and authorized access boundary.

## Scope

S3/KMS target architecture, metadata in PostgreSQL, type/size validation and audit access.

## Technical constraints

- Follow the project architecture.
- Preserve tenant and authorization boundaries.
- Use synthetic demo data only.
- Follow accessibility and responsive requirements.
- Do not introduce unnecessary dependencies.

## Acceptance criteria

- [x] Upload boundary exists
- [x] File validation exists
- [x] Tenant scope enforced
- [x] Authorized download exists
- [x] Access is audited

## Implementation notes

Actual S3 implementation can follow infrastructure readiness.

## Completion

- Implementation: Nest documents module with `GET`/`POST /patients/:id/documents` and
  `GET /patients/:id/documents/:documentId/content`. Metadata is `patient_documents` with RLS.
  Bytes use a local `DocumentObjectStore` with keys
  `practices/{practiceId}/patients/{patientId}/{documentId}`. Upload allows PDF/PNG/JPEG up to
  5 MiB after magic-byte sniff. Authz maps to `write:medical_records` (upload) and that grant or
  portal `read:own_patient` (list/download). Live profile lists and downloads seeded Avery Quinn
  intake PDF. No upload UI, PATCH, DELETE, or S3/KMS.
- Tests: File/access/service units; HTTP tests for anonymous 401, type/size 400, provider
  upload/list/download, receptionist/admin/nurse 403, portal self-scope, cross-tenant 404, client
  `practiceId` mismatch, and audit without filenames (`npm run test:api` with Compose Postgres).
  Vitest covers live GET mapping and profile documents; `npm run e2e:live` covers the seeded
  provider document list.
- PR:
- Notes: S3 SSE-KMS remains the target adapter. `DOCUMENT_STORAGE_DIR` defaults to
  `.document-storage`. Full role×resource matrix stays QA-004.
