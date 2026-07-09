# Engineering Status Reports

This directory contains versioned **Release Readiness Review** documents for OCTOPUS OS.

## Naming Convention

```
status_report_v{MAJOR}.{MINOR}.{PATCH}-{PRE}.md     <- Release Candidate snapshots
status_report_v{MAJOR}.{MINOR}.{PATCH}.md            <- Production release reviews
```

## When to Create a New Report

Create a new report when:
- A new Release Candidate is tagged
- A production release is approved
- A major infrastructure change invalidates the current report

Do **not** create a new report for minor fixes or non-material changes -- update the current revision instead.

## Report History

| File | Version | Date | Revision | Decision |
|------|---------|------|----------|----------|
| [status_report_v1.0.0-rc.1.md](./status_report_v1.0.0-rc.1.md) | v1.0.0-rc.1 | 2026-07-09 | Rev 5 | Approved as RC -- Blocked by Infrastructure |
