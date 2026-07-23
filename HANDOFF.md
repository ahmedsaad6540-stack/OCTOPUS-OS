# OCTOPUS OS — Handoff Document

Written for another Claude instance (or a human) picking this repository up cold. Read `SNAPSHOT_STATUS.md` and `NEXT_STEPS.md` first for what's done and what's next; this document is about *how* to keep working on it without breaking what's already here.

## Architecture, in one paragraph

OCTOPUS OS is a pnpm/TypeScript monorepo. `lib/db` is the single source of truth for the Postgres schema (Drizzle ORM). Fourteen other `lib/*` packages each implement one OS Core module (Event Bus, Task/Queue Manager, Brain, Decision Engine, Rule Engine, Agent Manager, AI Provider Manager, Tool Manager, Workflow Engine, Scheduler, Notification System, Audit & Observability, Settings) plus two generated API packages (`api-zod`, `api-client-react`, currently stale) and the OpenAPI spec package (`api-spec`). `artifacts/api-server` is an Express app that constructs one singleton per module and wires them together; `artifacts/octopus-os` and `artifacts/mockup-sandbox` are frontends. Nothing in `lib/*` talks to anything outside itself except `lib/db` — all cross-module communication either goes through the Event Bus or through a locally-declared interface satisfied structurally by a real instance wired in at the api-server layer.

## The one idea that matters most: structural decoupling

If module A needs to *call* module B (not just share a data shape), A does **not** add B as a package dependency. Instead A declares its own interface, in its own `types.ts`, whose method signatures exactly mirror the subset of B's public API that A needs. Because TypeScript uses structural typing, a real instance of B satisfies A's interface with zero glue code — and A's own tests can pass in a trivial fake instead.

Concrete examples already in the repo:
- `Brain`'s `EventPublisher`/`EventSubscriber` mirror `EventBus.publish`/`.subscribe` exactly.
- `RuleEngine`'s `RuleRegistrar` mirrors `Brain.registerRule`.
- `AgentManager`'s `AgentExecutor` is implemented for real by `ai-provider-manager`'s `ProviderBackedAgentExecutor`, which itself declares `AgentLike`/`AgentLikeExecutor` mirroring `AgentDefinition`/`AgentExecutor` rather than importing `@workspace/agent-manager`.
- `WorkflowEngine` depends on **four** sibling modules this way at once (`ToolInvoker`≈`ToolManager.invoke`, `AgentInvoker`≈`AgentManager.invoke`, `TaskEnqueuer`≈`TaskQueue.enqueue`, `EventPublisher`≈`EventBus.publish`) with zero compile-time imports of any of them.
- `Scheduler`'s `WorkflowRunner`/`TaskEnqueuer` mirror `WorkflowEngine.run`/`TaskQueue.enqueue`.
- `NotificationManager`'s `EventSubscriber` mirrors `EventBus.subscribe`.
- `ObservabilityService`'s `MetricsProbe` doesn't mirror anything specific — it's a generic `{name, collect()}` pair, and the api-server registers one closure per module that calls that module's real public method directly (the api-server, unlike `lib/*` packages, is allowed to import everything, since it's the composition root).

**If you add a new module that needs another module's behavior, follow this pattern.** Do not add `@workspace/x` as a dependency of `@workspace/y` unless `x` is a true foundation package like `db`, or you've made a deliberate, documented decision to do otherwise (this only happened once, intentionally — see `replit.md`'s "Two providers concepts" note, which is about data-model separation, not this rule).

## Registration vs. execution split

Any module with a "what actually happens" extension point splits it into two things: a durable *definition* (stored, CRUD'd, has a lifecycle) and a pluggable *executor/handler/client* (code, registered in-process, never reconstructed from stored data). Examples: `AgentManager`/`AgentExecutor`, `AiProviderManager`/`ProviderClient`, `ToolManager`/`ToolHandler`, `NotificationManager`/`NotificationChannel`. When you don't have a real credential or implementation for something, **register nothing and fail loudly** (a specific, catchable error type — `AgentExecutorNotConfiguredError`, `UnknownToolHandlerError`, etc.) rather than faking a response. This project's explicit standard is "no mocks, no placeholders" — an honest 501/error is compliant; a fake success is not.

## Repository conventions

- **One package per module** under `lib/<name>`, always with: `package.json` (name `@workspace/<name>`, `type: module`, `exports: {".": "./src/index.ts"}`, scripts `typecheck`/`test`), `tsconfig.json` (extends `../../tsconfig.base.json`, `composite: true`, references `../db` and anything else it structurally depends on... which should be nothing beyond `db` per the decoupling rule above), `src/index.ts` barrel export, and (if it has any) `src/*.test.ts` files run by `tsx --test`.
- **Store pattern**: every module with persisted state has a `<X>Store` interface, a `Drizzle<X>Store` (production, real Postgres via `@workspace/db`), and an `InMemory<X>Store` (tests only — never used in production wiring). Look at any existing module for the exact shape.
- **Error classes**: specific, named, exported `Error` subclasses for every distinct failure mode a caller might want to branch on (e.g. `ToolNotFoundError` vs `ToolDisabledError` vs `ToolInputValidationError` vs `UnknownToolHandlerError`), never a generic thrown string.
- **Logger interface**: every module defines its own minimal `<X>Logger` interface (`debug`/`info`/`warn`/`error`, each `(obj: Record<string,unknown>, msg?: string) => void`) with a no-op default, and the api-server passes in the real pino `logger` singleton. Never `console.log`.
- **api-server wiring files** live in `artifacts/api-server/src/lib/<name>.ts`, one per module, each exporting the singleton instance. Import order matters when one singleton depends on another (e.g. `agent-manager.ts` imports `ai-provider-manager.ts`); check existing files for the pattern before adding a new one.
- **Routes** live in `artifacts/api-server/src/routes/<name>.ts`, registered in `routes/index.ts`. Every route requiring auth uses `requireAuth`/`AuthRequest` from `middleware/auth.ts`. Mutating routes affecting system-wide state (not just the caller's own data) are admin-only (`req.user!.role !== "admin"` check at the top of the handler).
- **OpenAPI**: every new route gets a matching path + schema block appended to `lib/api-spec/openapi.yaml`, plus a `tags` entry. Validate the YAML parses (`python3 -c "import yaml; yaml.safe_load(open(...))"`) before moving on — a `oneOf`/anchor typo is easy to introduce and easy to miss otherwise.
- **Docs**: every module gets an entry in `replit.md`'s "Where things live" and "Architecture decisions" sections, a Gotchas bullet if it introduces a real caveat, and a bullet in `.agents/memory/octopus-os.md` plus an updated module list in `.agents/memory/MEMORY.md`. This isn't busywork — the memory docs are what a *future* session (including yours, next time) reads first.

## Coding conventions

- TypeScript strict mode (see `tsconfig.base.json`); `noImplicitAny`, `strictNullChecks`, `useUnknownInCatchVariables` all on. Catch blocks: `err instanceof Error ? err.message : String(err)`.
- ESM everywhere (`type: module`), relative imports use explicit `.js` extensions (even though the source is `.ts`) because that's what Node's ESM resolver needs at runtime.
- Prefer small, pure, directly-testable functions for anything algorithmic (see `renderTemplate` in both `rule-engine` and `workflow-engine`, `validateAgainstSchema` in `tool-manager`, `parseCronExpression`/`getNextRunTime` in `scheduler`) — inject side-effecting dependencies (`fetch`, `now()`) so the logic around them stays unit-testable without mocking frameworks.
- Never write a doc comment containing a literal `*/` mid-sentence — see `SNAPSHOT_STATUS.md`'s implementation notes for why this specifically bit the Scheduler module.

## Verification workflow (run after every module, no exceptions)

```bash
# 1. If you added/changed a lib/db schema file, rebuild it first:
npx tsc --build lib/db --force

# 2. Rebuild the composite lib chain (list every lib/* package with composite:true):
npx tsc --build lib/db lib/decision-engine lib/brain lib/rule-engine lib/agent-manager \
  lib/ai-provider-manager lib/tool-manager lib/workflow-engine lib/scheduler \
  lib/notification-system lib/audit-observability lib/settings --force

# 3. Install (picks up any new workspace package):
pnpm install --prefer-offline

# 4. Full typecheck:
pnpm run typecheck

# 5. Full test suite:
pnpm run test

# 6. Full build (these three env vars are required by mockup-sandbox/octopus-os's Vite config
#    and lib/db's DATABASE_URL check — placeholder values are fine for a build/typecheck pass):
PORT=5000 BASE_PATH=/ DATABASE_URL="postgres://user:pass@localhost:5432/db" pnpm run build

# 7. Only if 4-6 are all green: commit.
git add -A && git commit -m "Module N: <name> (<one-line summary>)"
```

Do not skip step 1/2 when you touch `lib/db/src/schema` — the composite build cache going stale produces a confusing, unrelated-looking error in whatever package imports the new export.

## Testing strategy

- Every `lib/*` package's tests are **unit tests with in-memory stores and fake dependencies**, no real Postgres, no real network (except where a real HTTP call is being verified via an *injected* `fetch` — see `AnthropicProviderClient`/`createWebhookChannel` — never a live call in a test).
- Test file naming: `<subject>.test.ts` next to the file it tests.
- Use `node:test` + `node:assert/strict`, run via `tsx --test src/**/*.test.ts` (see any `package.json`'s `test` script).
- When a module depends on another module's behavior via a decoupled interface, its tests construct a minimal fake satisfying that interface inline (see `createTestBus()`/`createFakeDeps()` patterns throughout) — never import the real sibling package into a unit test.

## How to continue without breaking previous modules

1. Read `SNAPSHOT_STATUS.md` for what exists. Read this file for how it's built. Read `NEXT_STEPS.md` for what's next.
2. Never modify a completed module's public interface (exported types, class method signatures, store interfaces) without checking every consumer first — several modules depend on each other's exact shapes structurally, so a signature change can silently break a sibling module's typecheck in a non-obvious file.
3. Never add a `lib/*` → `lib/*` dependency that isn't already there, except `→ db`, without first checking whether a structurally-decoupled interface would work instead (it almost always will — see "The one idea that matters most" above).
4. Follow the per-module workflow exactly: design → implement (types → core class → store(s) → index barrel → tests) → wire into api-server (singleton file → routes file → register route → package.json/tsconfig references, both root and api-server) → OpenAPI (paths + tag + schemas) → full verification (the six steps above) → docs (replit.md + both memory files) → commit.
5. If a new module or cross-cutting change (multi-tenancy, i18n) would require modifying many existing modules' stores/routes, **stop and flag it explicitly rather than doing it silently** — this is a documented project rule, not a suggestion, and it's exactly the situation multi-tenancy is in right now (see `NEXT_STEPS.md`).
6. Keep using git: one commit per completed module, descriptive message, never squash/rewrite history that predates your session.
