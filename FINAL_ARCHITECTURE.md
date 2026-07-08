# OCTOPUS OS — Final Architecture

## Overview

OCTOPUS OS is a pnpm/TypeScript monorepo implementing an event-driven "operating system" for AI-agent-based business automation. Fourteen OS Core modules, one Express api-server composition root, two frontends, and a shared Postgres schema.

## Core architectural principles

### 1. Event Bus is the backbone

`@workspace/event-bus` (`lib/event-bus`) is the only inter-module communication channel for anything that isn't a direct library call. Every event is persisted to the `events` table before dispatch, so the event log doubles as an audit trail and a replay source. Subscriber failures are isolated per-subscriber — one bad handler never breaks another or the publisher.

### 2. Structural decoupling between sibling modules

No `lib/*` package imports another `lib/*` package's implementation unless that package is a true foundation (`lib/db`, or `brain`→`decision-engine` as an intentional exception where Decision Engine is a pure, dependency-free arbitration library). When module A needs to call module B's *behavior*, A declares a local interface in its own `types.ts` mirroring the exact method signatures it needs from B. Because TypeScript is structurally typed, a real instance of B satisfies A's interface with zero adapter code, and A's unit tests substitute a trivial fake instead.

Every instance of this pattern in the repo:

| Module (A) | Interface | Mirrors (B) |
|---|---|---|
| Brain | `EventPublisher`/`EventSubscriber` | `EventBus.publish`/`.subscribe` |
| Task Queue | `EventPublisher` | `EventBus.publish` |
| Rule Engine | `RuleRegistrar` | `Brain.registerRule` |
| AI Provider Manager | `AgentLike`/`AgentLikeExecutor` | `AgentDefinition`/`AgentExecutor` (in Agent Manager) |
| Tool Manager | `EventPublisher` | `EventBus.publish` |
| Workflow Engine | `ToolInvoker`, `AgentInvoker`, `TaskEnqueuer`, `EventPublisher` | `ToolManager.invoke`, `AgentManager.invoke`, `TaskQueue.enqueue`, `EventBus.publish` (four at once) |
| Scheduler | `WorkflowRunner`, `TaskEnqueuer` | `WorkflowEngine.run`, `TaskQueue.enqueue` |
| Notification System | `EventSubscriber` | `EventBus.subscribe` |

The api-server (`artifacts/api-server/src/lib/*.ts`) is the one place concrete instances are wired together — it's allowed to import everything, since it's the composition root, not a peer module.

### 3. Registration vs. execution split

Modules with an extensible "what actually runs" concept split the durable *definition* from the pluggable *executor*:

- `AgentManager` (definition: `AgentDefinition`) / `AgentExecutor` (execution — fulfilled for real by `ai-provider-manager`'s `ProviderBackedAgentExecutor`)
- `AiProviderManager` (definition: `AiProviderConfig`) / `ProviderClient` (execution — `AnthropicProviderClient` ships real)
- `ToolManager` (definition: `ToolDefinition`) / `ToolHandler` (execution — none ship built in; registered per-deployment)
- `NotificationManager` (definition: `NotificationChannelConfig`) / `NotificationChannel` (execution — `in_app`/`webhook` ship real)

Missing execution capability always fails loudly with a specific, catchable error (`AgentExecutorNotConfiguredError`, `UnknownToolHandlerError`, etc.), never a faked response.

### 4. Durable-first

Every module doing anything asynchronous or stateful records what happened in Postgres, not just in memory: `brain_decisions`, `agent_runs`, `workflow_runs`, `scheduled_job_runs`, `notification_deliveries`, `audit_log`. Tool invocations aren't separately stored but broadcast as `tool.invoked`/`tool.failed` events, landing in the `events` table.

### 5. Cross-cutting concerns via middleware/probes, not per-route edits

- **Audit**: one global Express middleware (`middleware/audit.ts`) records every successful mutating request automatically, deriving `action`/`resourceType` from the matched route *pattern*.
- **Observability**: `ObservabilityService` aggregates a status snapshot from independently-registered `MetricsProbe`s, each calling a module's own public read method — the service itself never touches a database.
- **Metrics**: `middleware/metrics.ts` records every request into a `prom-client` registry, labeled by matched route pattern (bounded cardinality).
- **Tracing**: `tracing.ts`, imported first in `index.ts`, bootstraps OpenTelemetry auto-instrumentation.

None of these four required modifying any of the ~13 pre-existing route files they cover.

## Module reference

Full per-module detail (types, error classes, store shapes, exact integration points) lives in `.agents/memory/octopus-os.md` and `replit.md`, which are the living architecture documents this project has maintained continuously. This file is a summary; those are the source of truth for specifics.

## Dependency graph

```
db  (leaf)
 ├─ event-bus              (standalone)
 ├─ task-queue               → db
 ├─ decision-engine           (standalone)
 ├─ brain                      → db, decision-engine
 ├─ rule-engine                  → db
 ├─ agent-manager                  → db
 ├─ ai-provider-manager              → db
 ├─ tool-manager                      → db
 ├─ workflow-engine                    → db
 ├─ scheduler                            → db
 ├─ notification-system                    → db
 ├─ audit-observability                      → db
 └─ settings                                   → db

artifacts/api-server → all 14 of the above, + api-zod, api-client-react
```

Every module beyond `db` (and `brain`→`decision-engine`) reaches its siblings only through the structural-decoupling pattern above, never a package dependency.

## Frontend architecture

`artifacts/octopus-os` and `artifacts/mockup-sandbox` are presentation-only — no business logic. `mockup-sandbox` is the original pre-OS-Core scaffold; `octopus-os` is intended to consume the real API. Neither has been extended with UI for the 14 modules built in this session — that's real, acknowledged scope not covered here (see `NEXT_PHASE_RECOMMENDATIONS.md`).

## Security architecture

See `FINAL_SECURITY_REPORT.md`.

## Deployment architecture

See `FINAL_DEPLOYMENT_GUIDE.md`.
