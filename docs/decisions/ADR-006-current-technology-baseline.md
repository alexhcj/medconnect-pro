# ADR-006 — Current Technology Baseline

## Status

Accepted

## Decision

The project uses current stable releases available when implementation is performed, rather than
preserving historical versions to simulate a past development date.

## Rule

When starting a new implementation slice, verify current stable versions from official package
registries/docs. Do not upgrade blindly during an unrelated feature; record significant version
changes separately.

## Rationale

This is a demonstration project whose purpose is to show modern engineering decisions, not a
historical reconstruction.
