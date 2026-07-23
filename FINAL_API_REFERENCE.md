# OCTOPUS OS — Final API Reference

Full request/response schemas for everything below are in `lib/api-spec/openapi.yaml` (source of truth). This document is a navigable summary. All paths are mounted under `/api`. Endpoints marked **[legacy]** predate this session and were not modified.

## Auth (pre-existing)

`POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`. Rate-limited at 20 req/IP/15min (added this session, `middleware/security.ts`, without modifying `routes/auth.ts`).

## Legacy business routes **[legacy, untouched]**

`/api/providers*`, `/api/social*`, `/api/affiliates*`, `/api/campaigns*` — pre-existing per-user CRUD features, unrelated to OS Core.

## Event Bus

- `GET /api/system/events`, `GET /api/system/events/{id}` — read-only event log.

## Task/Queue Manager

- `POST /api/tasks`, `GET /api/tasks`, `GET /api/tasks/{id}`, `POST /api/tasks/{id}/cancel`
- `POST /api/tasks/claim`, `POST /api/tasks/{id}/complete`, `POST /api/tasks/{id}/fail`

## Brain

- `GET /api/brain/decisions`, `GET /api/brain/decisions/{id}` — read-only decision trail.

## Rule Engine

- `POST /api/rules`, `GET /api/rules`, `GET /api/rules/{id}`, `PUT /api/rules/{id}`, `DELETE /api/rules/{id}`
- `POST /api/rules/{id}/enable`, `POST /api/rules/{id}/disable`

## Agent Manager

- `POST /api/agents`, `GET /api/agents`, `GET /api/agents/{id}`, `PUT /api/agents/{id}`, `DELETE /api/agents/{id}`
- `POST /api/agents/{id}/enable`, `POST /api/agents/{id}/disable`
- `POST /api/agents/{id}/invoke` — synchronous, records an `AgentRun`
- `GET /api/agents/{id}/runs` — run history

## AI Provider Manager

- `POST /api/provider-configs`, `GET /api/provider-configs`, `GET /api/provider-configs/{id}`, `PUT /api/provider-configs/{id}`, `DELETE /api/provider-configs/{id}` — all admin-only

## Tool Manager

- `POST /api/tools`, `GET /api/tools`, `GET /api/tools/{id}`, `PUT /api/tools/{id}`, `DELETE /api/tools/{id}`
- `POST /api/tools/{id}/enable`, `POST /api/tools/{id}/disable`
- `POST /api/tools/{name}/invoke` — schema-validated

## Workflow Engine

- `POST /api/workflows`, `GET /api/workflows`, `GET /api/workflows/{id}`, `PUT /api/workflows/{id}`, `DELETE /api/workflows/{id}`
- `POST /api/workflows/{id}/enable`, `POST /api/workflows/{id}/disable`
- `POST /api/workflows/{id}/run`, `GET /api/workflows/{id}/runs`

## Scheduler

- `POST /api/scheduled-jobs`, `GET /api/scheduled-jobs`, `GET /api/scheduled-jobs/{id}`, `PUT /api/scheduled-jobs/{id}`, `DELETE /api/scheduled-jobs/{id}` — all admin-only
- `POST /api/scheduled-jobs/{id}/enable`, `POST /api/scheduled-jobs/{id}/disable`
- `GET /api/scheduled-jobs/{id}/runs`

## Notification System

- `POST /api/notification-channels`, `GET /api/notification-channels`, `GET /api/notification-channels/{id}`, `PUT /api/notification-channels/{id}`, `DELETE /api/notification-channels/{id}` — admin-only
- `POST /api/notifications/send` — any authenticated user, scoped to self unless admin
- `GET /api/notifications` — the caller's inbox (or all, for admins)
- `POST /api/notifications/{id}/read`

## Audit & Observability

- `GET /api/system/status` — admin-only, aggregated health snapshot
- `GET /api/audit-log`, `GET /api/audit-log/{id}` — admin-only, read-only

## Settings

- `GET /api/settings/system`, `GET /api/settings/system/{key}` — read open to any authenticated user
- `PUT /api/settings/system/{key}`, `DELETE /api/settings/system/{key}` — admin-only
- `GET /api/settings/me`, `GET /api/settings/me/{key}`, `PUT /api/settings/me/{key}`, `DELETE /api/settings/me/{key}` — every user, own data only

## Operational endpoints

- `GET /api/healthz` — liveness, unauthenticated
- `GET /api/metrics` — Prometheus scrape, unauthenticated

## Authentication requirements summary

Every route above except `/api/healthz`, `/api/metrics`, `POST /api/auth/register`, and `POST /api/auth/login` requires a valid JWT (`requireAuth`). Within that, "admin-only" mutations are marked explicitly above; anything not marked is open to any authenticated user, scoped to their own data where the resource is inherently personal.

## OpenAPI codegen status

`lib/api-zod`/`lib/api-client-react` predate this session's ~13 new route files and have not been regenerated (no network access to run codegen tooling in this environment). Every new route hand-rolls equivalent request validation directly. Re-run `pnpm --filter @workspace/api-spec run codegen` and migrate once network access is available.
