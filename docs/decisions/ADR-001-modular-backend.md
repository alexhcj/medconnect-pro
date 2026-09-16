# ADR-001 — Modular Backend

## Status

Accepted

## Decision

Start with one modular NestJS backend rather than independently deployed microservices.

## Rationale

The project needs clear domain boundaries but does not yet justify distributed-system complexity.

## Initial modules

Identity, Practice/Provider, Patient, Scheduling, EHR, Telehealth, Billing, Notifications and
Audit/Compliance.

## Future extraction

Extract only when operational, scaling or team boundaries justify it.
