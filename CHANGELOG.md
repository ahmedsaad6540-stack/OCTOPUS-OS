# Changelog

All notable changes to OCTOPUS OS, in chronological order. Format loosely follows [Keep a Changelog](https://keepachangelog.com/); this project doesn't yet use semantic version tags, so entries are grouped by commit/module instead.

## [Unreleased]

### Added — Observability & hardening pass
- Structured logging: pino now attaches the active OpenTelemetry `traceId`/`spanId` to every log line via a `mixin()`.
- Distributed tracing: real OpenTelemetry `NodeSDK` bootstrap (`tracing.ts`), console exporter by default, OTLP exporter if `OTEL_EXPORTER_OTLP_ENDPOINT` is set. Documented limitation: bundled libraries (express, pg) may not receive library-level instrumentation since `build.mjs` inlines them; Node built-in (`http`) instrumentation is unaffected.
- Monitoring: real Prometheus metrics via `prom-client` at `GET /api/metrics` (default Node.js process metrics + HTTP request counter/histogram labeled by matched route pattern).
- Security hardening: `helmet` security headers globally; tiered `express-rate-limit` (300 req/15min general API, 20 req/15min on `/api/auth*` specifically, applied without modifying `routes/auth.ts`).
- Deployment artifacts: production multi-stage `Dockerfile`, `docker-compose.prod.yml` (api-server + Postgres), `.github/workflows/ci.yml` (typecheck/test/build on push/PR). None executed against real infrastructure from this environment — see `FINAL_DEPLOYMENT_GUIDE.md`.

### Added — Module 14: Settings
- `@workspace/settings`: generic key-value settings at `system` or `user` scope, backed by a database-unique `compositeKey` enabling true `INSERT ... ON CONFLICT` upserts.
- Routes: `/api/settings/system*` (read open, write admin-only), `/api/settings/me*` (full read/write/delete, caller's own data only).

### Added — Module 13: Audit & Observability
- `@workspace/audit-observability`: `AuditLogger` (own `audit_log` table) + `ObservabilityService` (probe-based system status aggregation).
- Global Express middleware (`middleware/audit.ts`) auto-records every successful mutating request across the entire system, with zero changes to any pre-existing route file.
- Routes: `GET /api/system/status`, `GET /api/audit-log*` (both admin-only).

### Added — Module 12: Notification System
- `@workspace/notification-system`: channel configuration + delivery tracking, where the delivery record doubles as the in-app inbox.
- Ships `in_app` and `webhook` (real HTTP POST, injectable `fetch`) channels; optional Event Bus trigger via a `notification.requested` event type.
- Routes: `/api/notification-channels*` (admin-only), `/api/notifications*` (send/inbox/mark-read).

### Added — Module 11: Scheduler
- `@workspace/scheduler`: real, from-scratch 5-field cron parser + interval scheduling, dispatching through decoupled `WorkflowRunner`/`TaskEnqueuer` interfaces.
- Started via `scheduler.start()` at api-server boot, stopped on graceful shutdown.
- Routes: `/api/scheduled-jobs*` (admin-only).

### Added — Module 10: Workflow Engine
- `@workspace/workflow-engine`: ordered, no-branching multi-step orchestration across `tool`/`agent`/`task`/`event` step types, each delegating to the real module that owns that capability via decoupled interfaces (the first module to depend on four siblings simultaneously this way).
- Whole-token templating threads earlier steps' outputs into later steps' inputs.
- Routes: `/api/workflows*`.

### Added — Module 9: Tool Manager
- `@workspace/tool-manager`: tool registration, a minimal hand-rolled JSON-Schema-like input validator, and an in-process handler registry.
- Integrated into Agent Manager's routes: agent `capabilities` are validated against the live tool registry on create/update.
- Routes: `/api/tools*`.

### Added — Module 8: AI Provider Manager
- `@workspace/ai-provider-manager`: provider configuration (never stores a raw credential, only an env var name) plus a real `AnthropicProviderClient` (genuine HTTP call, injectable `fetch` for testing).
- `ProviderBackedAgentExecutor` wired into Agent Manager's constructor as its real `AgentExecutor` — no parallel execution path.
- Routes: `/api/provider-configs*`.

### Added — Module 7: Agent Manager
- `@workspace/agent-manager`: agent registry, lifecycle, and durable run history. Fails loudly (`AgentExecutorNotConfiguredError`) rather than faking execution before AI Provider Manager existed.
- Routes: `/api/agents*`.

### Baseline (session start)
- Event Bus, Task/Queue Manager, Brain, Decision Engine, Rule Engine already complete and committed as the starting point of this session's continuous work.
