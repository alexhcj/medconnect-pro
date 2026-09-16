Phase-Based Core Services Architecture (Execution Roadmap)

## Purpose
This is the **execution-oriented source of truth** for implementation.
* Product requirements = what/why
* Architecture + ADRs = how/why major technical decisions
* This file = what to implement and in what order
* Roadmaps = when
* Code = current implementation

# 0. Global Architecture Decisions

## Frontend
* Next.js App Router
* React + TypeScript
* TanStack React Query
* Accessible healthcare UI
* Responsive tablet/mobile design

## Backend
* Node.js 24 LTS
* TypeScript
* NestJS 12
* REST + OpenAPI
* WebSockets for application real-time features
* WebRTC for telehealth

## Data
* PostgreSQL 18 LTS
* Redis
* S3 + KMS
* FHIR R4-aligned clinical data boundaries

## Messaging
* SQS for durable asynchronous work
* SNS for fan-out events/notifications
* Kafka only when event-streaming requirements justify it

## Infrastructure
* AWS
* Docker
* ECS + Fargate initially
* EKS/Kubernetes only when scale/team/operational requirements justify it
* Terraform
* GitHub Actions
* CloudWatch
* dev/staging/prod environments

## Security
* OAuth 2.0 + OpenID Connect
* Authorization Code + PKCE
* MFA
* RBAC
* Tenant isolation
* Audit logging
* Encryption at rest
* TLS in transit
* Secrets management
* Least-privilege IAM

# 1. Architecture Strategy
Do **not** start with six independently deployed microservices.
Start with a **modular NestJS backend** with explicit domain boundaries:
* Identity & Access
* Practice / Provider
* Patient
* Scheduling
* EHR
* Telehealth
* Billing
* Notifications
* Audit / Compliance

Keep boundaries clean enough for later extraction.

Likely future extraction candidates: - Telehealth - Notifications / workers - Billing / claims workers - Audit/event processing

## Vertical-slice strategy

A feature is meaningfully implemented when the necessary layers exist:

UI → frontend query/data layer → API contract → controller → application/service layer → DB/external integration → tests → observability/audit where applicable

Prefer complete vertical slices over finishing one layer of the whole system first.

# 2. PHASE 0 --- Infrastructure & Security Foundation

**Initial setup: Weeks 0--2. Continuous afterward.**

## Repository / local environment
* [ ] TypeScript strict mode
* [ ] ESLint
* [ ] Prettier
* [ ] Environment conventions
* [ ] `env.example`
* [ ] Local setup documentation
* [ ] Commit convention

## Docker
* [ ] NestJS Dockerfile
* [ ] PostgreSQL local container
* [ ] Redis local container
* [ ] Docker Compose
* [ ] Production-oriented image
* [ ] Non-root container
* [ ] Healthcheck

## AWS
* [ ] AWS environments/accounts
* [ ] VPC
* [ ] Public/private subnets
* [ ] Security groups
* [ ] IAM
* [ ] RDS PostgreSQL
* [ ] ElastiCache Redis
* [ ] S3
* [ ] KMS
* [ ] Secrets Manager / Parameter Store
* [ ] CloudWatch
* [ ] Backups

## Terraform
* [ ] Provider
* [ ] Remote state strategy
* [ ] Network module
* [ ] DB-module
* [ ] Redis module
* [ ] S3/KMS module
* [ ] IAM module
* [ ] ECS/Fargate module
* [ ] Environment configuration
* [ ] `plan` / `apply` workflow

## CI/CD
* [ ] Install
* [ ] Lint
* [ ] Type-check
* [ ] Unit tests
* [ ] Frontend build
* [ ] Backend build
* [ ] Docker build
* [ ] Dependency/security scan
* [ ] Development deploy
* [ ] Staging deploy
* [ ] Production approval gate

## Security baseline
* [ ] TLS
* [ ] Secure headers
* [ ] CORS policy
* [ ] Rate limiting
* [ ] Secrets outside source control
* [ ] Least-privilege IAM
* [ ] Audit event model
* [ ] Backup/restore plan
* [ ] Security logs

# 3. PHASE 1 --- Identity & Core Platform

**Weeks 1--4**

## Authentication
* [ ] OAuth 2.0 authorization flow
* [ ] OpenID Connect identity layer
* [ ] Authorization Code + PKCE
* [ ] Access-token lifecycle
* [ ] Refresh-token rotation
* [ ] Secure cookie strategy where appropriate
* [ ] Login/logout
* [ ] Logout-all/sessions
* [ ] MFA/TOTP
* [ ] Account recovery
* [ ] Session management
* [ ] Login audit events

## Authorization

Implement:

Authentication → User identity → Practice/tenant context → Role → Permission → Resource ownership/assignment
* [ ] UserRole enum
* [ ] Permission definitions
* [ ] RBAC guards/policies
* [ ] Tenant enforcement
* [ ] Resource-level checks
* [ ] Authorization tests

## Core platform
* [ ] Global error format
* [ ] DTO validation
* [ ] Request correlation ID
* [ ] Structured logging
* [ ] Health endpoint
* [ ] Readiness endpoint
* [ ] OpenAPI/Swagger
* [ ] API versioning
* [ ] Pagination
* [ ] Sorting/filtering conventions
* [ ] Standard response/error schemas

# 4. MULTI-TENANCY --- Practice/User Boundaries

## Tenant model

Practice ├── Users ├── Providers ├── Patients ├── Appointments ├── Clinical Records ├── Documents └── Billing Data

## Boundary matrix

| Role           | Tenant scope     | Patient scope       | Clinical                            | Billing                   | Admin   |
| -------------- | ---------------- | ------------------- | ----------------------------------- | ------------------------- | ------- |
| SUPER_ADMIN    | All              | All permitted       | All permitted                       | All                       | Global  |
| PRACTICE_ADMIN | Own practice     | Own practice        | Administrative / explicitly granted | Own practice              | Full    |
| PROVIDER       | Own practice     | Assigned/authorized | Full authorized clinical            | Relevant                  | Limited |
| NURSE          | Own practice     | Assigned            | Vitals + permitted clinical         | Limited                   | Limited |
| RECEPTIONIST   | Own practice     | Demographics/admin  | No clinical by default              | Appointment/billing admin | Limited |
| PATIENT        | Own relationship | Self                | Own portal records                  | Own payments              | Self    |

## Technical enforcement
* [ ] Every tenant-owned record has `practice_id`
* [ ] Tenant derived from authenticated identity/session
* [ ] Never trust browser-supplied `practice_id` for authorization
* [ ] Repository/service tenant scope
* [ ] PostgreSQL RLS for sensitive boundaries where appropriate
* [ ] Tenant-aware indexes
* [ ] Cross-tenant access tests
* [ ] Audit denied access
* [ ] Tenant-aware cache keys
* [ ] Tenant-aware object-storage paths/policies

# 5. REST + OpenAPI

## REST responsibility
* Resource-oriented endpoints
* HTTP semantics
* Authentication/authorization
* Request validation
* Pagination/filtering
* Error responses
* CRUD/business operations

## OpenAPI responsibility
* API contract
* Endpoint definitions
* Request/response schemas
* Auth requirements
* Error schemas
* Documentation
* Contract/testing support

**OpenAPI does not store application data.**

## Data flow

Next.js → API client → HTTP request → API Gateway → NestJS Controller → DTO validation → Authorization → Application Service → Repository/integration → PostgreSQL / Redis / S3 / external API → Response DTO → Frontend

## Tasks
* [ ] OpenAPI configuration
* [ ] DTO schemas
* [ ] Security schemes
* [ ] Standard errors
* [ ] Pagination schemas
* [ ] Critical API contract tests

# 6. PHASE 2 --- Patient Management

**Weeks 3--6**
* [ ] Patient registration
* [ ] Demographics
* [ ] Search/contact/emergency contacts
* [ ] Insurance information
* [ ] Patient status
* [ ] Provider assignment
* [ ] Search/filter/sort/pagination
* [ ] Patient profile
* [ ] Patient edit

## Documents
* [ ] Secure upload
* [ ] S3 storage
* [ ] KMS encryption
* [ ] File metadata in PostgreSQL
* [ ] Type/size validation
* [ ] Authorized download
* [ ] Categories
* [ ] Audit access

## Frontend slice
* [ ] Patient list
* [ ] Search
* [ ] Filters
* [ ] Patient profile
* [ ] Registration form
* [ ] Edit form
* [ ] Loading/error/empty states
* [ ] Accessibility
* [ ] Mobile layout

# 7. PHASE 3 --- Scheduling

**Weeks 4--8**
* [ ] Provider schedules
* [ ] Availability
* [ ] Time slots
* [ ] Appointment CRUD
* [ ] Conflict detection
* [ ] Check-in/check-out
* [ ] Calendar views
* [ ] Waitlist
* [ ] Reminder jobs
* [ ] Email notification
* [ ] SMS abstraction
* [ ] Appointment audit events

# 8. PHASE 4 --- EHR / Clinical Data

**Weeks 6--12**
* [ ] FHIR R4-aligned Patient boundary
* [ ] Clinical notes
* [ ] Diagnoses
* [ ] Vital signs
* [ ] Medications
* [ ] Lab results
* [ ] Medical history
* [ ] Clinical access controls
* [ ] Audit trail
* [ ] Import/export boundary
* [ ] External EHR integration abstraction

> Do not claim full FHIR compliance merely because a DTO resembles a FHIR resource. Document exactly which resources/workflows are supported.

# 9. PHASE 5 --- Telehealth

**Weeks 9--14**

## Session backend
* [ ] Appointment validation
* [ ] Session creation
* [ ] Participant authorization
* [ ] Session state
* [ ] Waiting room
* [ ] Join/leave events
* [ ] Session timeout/grace logic
* [ ] Audit events

## WebRTC
* [ ] Signaling layer
* [ ] ICE/STUN/TURN strategy
* [ ] Connection lifecycle
* [ ] Device permission workflow
* [ ] Network quality reporting

## Real-time
* [ ] WebSocket/[Socket.IO](http://Socket.IO) gateway
* [ ] Secure room membership
* [ ] Chat
* [ ] Reconnection
* [ ] File-share events

## Recording
* [ ] Recording policy
* [ ] Recording metadata
* [ ] Encrypted object storage
* [ ] Authorized playback
* [ ] Retention policy
* [ ] Audit access
* [ ] Deletion workflow

> KMS manages cryptographic keys and key usage; S3 stores the recording objects. KMS is not the video-storage system.

# 10. PHASE 6 --- Billing & Revenue Cycle

**Weeks 11--16**
* [ ] Billing accounts
* [ ] Invoices
* [ ] Payments
* [ ] Payment plans
* [ ] Stripe integration boundary
* [ ] Insurance eligibility abstraction
* [ ] Claims
* [ ] EDI 837 generation boundary
* [ ] Claim status
* [ ] Denial workflow
* [ ] Resubmission
* [ ] Revenue analytics
* [ ] Billing audit events

## Async workers
* [ ] Claims
* [ ] Payment events
* [ ] Invoice generation
* [ ] Notifications
* [ ] Reports

# 11. PHASE 7 --- Notifications
* [ ] Notification domain
* [ ] In-app notifications
* [ ] Email abstraction
* [ ] SMS abstraction
* [ ] Push boundary
* [ ] Preferences
* [ ] Retry strategy
* [ ] Dead-letter queue
* [ ] Audit-sensitive events

## Messaging pattern

Business Service → SNS topic → SQS queues → Workers

Use SQS when work must wait safely for a consumer. Use SNS when one event must fan out to multiple subscribers.

Kafka is deferred until event-streaming requirements justify its operational and architectural complexity.

# 12. PHASE 8 --- Analytics & Reporting

**Weeks 12--16**
* [ ] Dashboard metrics API
* [ ] Appointment metrics
* [ ] Patient volume
* [ ] Provider productivity
* [ ] Revenue metrics
* [ ] Telehealth usage
* [ ] Date-range filtering
* [ ] Aggregation queries
* [ ] Cache expensive metrics
* [ ] Export/report generation

# 13. PHASE 9 --- Administration & Compliance

**Weeks 13--18**

## Practice administration
* [ ] Practice profile
* [ ] Operating hours
* [ ] Appointment settings
* [ ] Billing settings
* [ ] User management
* [ ] Role assignment
* [ ] Permission management

## Security/compliance
* [ ] Audit viewer
* [ ] Access history
* [ ] Security events
* [ ] Session policy
* [ ] MFA policy
* [ ] Backup status
* [ ] Data retention
* [ ] Incident-support information
* [ ] Compliance evidence collection

# 14. PHASE 10 --- Scale & Reliability

**Weeks 15--20**
* [ ] Load testing
* [ ] Database indexes
* [ ] Query profiling
* [ ] Redis caching
* [ ] Connection-pool tuning
* [ ] ECS horizontal scaling
* [ ] Queue worker scaling
* [ ] Rate-limit tuning
* [ ] CDN strategy
* [ ] Observability dashboards
* [ ] Alert thresholds
* [ ] Disaster recovery test
* [ ] Backup restoration test
* [ ] Security penetration test
* [ ] Dependency update process

# 15. Infrastructure Lifecycle

Infrastructure is **not a final phase**.

Phase 0 creates the foundation, then infrastructure continues in parallel:
* Networking
* CI/CD
* Monitoring
* Backups
* Security
* Scaling
* Reliability
* Cost optimization

One DevOps/platform engineer can establish the initial foundation while frontend/backend developers work on product features.

# 17. Encryption

## At rest

S3 object → S3 SSE-KMS → KMS key

RDS PostgreSQL → KMS-backed encryption → encrypted storage

KMS manages keys, permissions and cryptographic operations. S3/RDS store the actual data.

## In transit
* [ ] TLS/HTTPS
* [ ] Secure WebSockets
* [ ] Internal TLS where required
* [ ] Certificate management
* [ ] WebRTC DTLS/SRTP through selected media architecture

# 18. Testing

## Unit
* [ ] Domain services
* [ ] Permission policies
* [ ] Validation
* [ ] Utilities

## Integration
* [ ] PostgreSQL
* [ ] Redis
* [ ] S3
* [ ] Queues/workers
* [ ] Authentication

## API/contract
* [ ] OpenAPI contract tests
* [ ] Critical endpoints
* [ ] Authorization
* [ ] Tenant isolation

## E2E
* [ ] Login
* [ ] Create patient
* [ ] Schedule appointment
* [ ] Provider workflow
* [ ] Telehealth
* [ ] Billing
* [ ] Admin

## Security
* [ ] Dependency scanning
* [ ] Secret scanning
* [ ] Authorization bypass tests
* [ ] Cross-tenant tests
* [ ] Rate-limit tests
* [ ] Upload security tests

# 19. Market-Aligned Delivery

## Month 0--3 --- MVP
* 2--3 pilot practices
* Infrastructure foundation
* Authentication
* RBAC
* Tenant isolation
* Patient management
* Scheduling
* Basic dashboard
* Initial audit logging

## Month 3--6
* EHR foundation
* Telehealth foundation
* Billing foundation
* Security hardening
* SOC 2 readiness
* Production telemetry

## Month 6--12
* EHR integrations
* Telehealth maturity
* Billing/revenue cycle
* Reliability
* 20--30 practices target

## Month 12--15
* 30--50 practices target
* Enterprise requirements
* Performance optimization
* Observability maturity
* Compliance evidence

## Month 15--18
* Series A preparation
* Revenue/retention evidence
* Capacity planning
* Hiring plan
* Post-funding architecture

Series A is a funding target, not a guaranteed technical milestone.

# 20. Near-Series-A Engineering Capacity Assumption

Planning assumptions:
* 30--50 practices
* ~15--30 staff users/practice
* ~450--1,500 staff accounts
* ~10,000--30,000 patient records
* ~5,000--15,000 monthly active patient users
* ~2--6M application API requests/month
* Design headroom toward ~10M requests/month
* ~100--500 GB/month ordinary application payload

Telehealth media traffic is planned separately and can reach TB-scale depending on call duration, recording and media architecture.

These are planning assumptions, not claimed historical production metrics.

# 21. Portfolio Definition of Done

A feature is not complete merely because the UI exists.

For a portfolio-quality vertical slice:
* [ ] UX/UI
* [ ] Responsive behavior
* [ ] Accessibility
* [ ] Frontend validation
* [ ] API endpoint
* [ ] DTO validation
* [ ] Authorization
* [ ] Tenant isolation
* [ ] DB model/migration
* [ ] Error handling
* [ ] Loading/empty/error states
* [ ] Unit tests
* [ ] Integration/API tests
* [ ] Audit logging when applicable
* [ ] Documentation
* [ ] Deployment
* [ ] Demo data

# 22. Recommended First Vertical Slices

Do not attempt to implement the entire roadmap before having something demonstrable.

Recommended order:
1. Authentication
2. Dashboard shell
3. Patient list
4. Patient profile
5. Create/edit patient
6. Appointment creation
7. Calendar
8. Patient → appointment workflow
9. Basic clinical record
10. Telehealth session shell
11. Billing dashboard
12. Practice/user administration

Each slice should connect frontend → backend → database → tests.
