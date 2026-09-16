# ADR-005 — Synthetic Demo Data

## Status

Accepted

## Decision

The demo uses deterministic synthetic healthcare data only.

## Rationale

The application is a portfolio/interview demonstration and must not require real PHI.

## Rules

- no real patient records;
- no real identifiers;
- no real clinical records;
- no real credentials;
- fixtures must be clearly synthetic;
- production integrations remain adapters/boundaries until real infrastructure is intentionally introduced.
