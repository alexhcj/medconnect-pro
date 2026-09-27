# Backend Architecture

## Strategy

Start as a modular NestJS application.

Do not prematurely deploy every domain as a separate microservice.

## Modules

- Identity & Access
- Practice / Provider
- Patient
- Scheduling
- EHR
- Telehealth
- Billing
- Notifications
- Audit / Compliance

## Layering

```text
Controller
  ↓
Application / Service
  ↓
Repository / Integration
  ↓
Persistence / External Service
```

Controllers remain thin.

DTOs validate external input.

Application/domain services implement business rules.

Repositories isolate persistence.

## Vertical slice

```text
Frontend
  ↓
API contract
  ↓
Controller
  ↓
DTO validation
  ↓
Authorization
  ↓
Application service
  ↓
Repository/integration
  ↓
Database/external service
  ↓
Response DTO
```

## Notification delivery

Target path: business service → SNS topic → SQS queues → workers. Use SNS when one event must
fan out; use SQS when work must wait safely for a consumer.

Current path ([BE-008](../tasks/backend/BE-008-notification-domain.md)): the same `DeliveryBus`
port is an in-process dispatcher. Email and SMS use demo adapters (no SMTP or carrier). In-app
rows persist synchronously. Retry is three attempts with 1s then 4s between them;
exhausted jobs persist `failed` as the local dead-letter equivalent. Kafka and AWS SDKs are
out of scope until infrastructure exists.

## Future extraction candidates

Only when justified:

- Telehealth;
- notification workers;
- billing/claims workers;
- audit/event processing.
