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

## Future extraction candidates

Only when justified:

- Telehealth;
- notification workers;
- billing/claims workers;
- audit/event processing.
