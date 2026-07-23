# OCTOPUS OS — Final Deployment Guide

**Honesty note up front:** everything in this guide is real, correct configuration — but none of it has been executed against real infrastructure from the environment that produced this repository (no Docker daemon, no reachable Postgres, no deployment target, no CI runner). Follow it as a genuine first attempt at deployment, and expect to debug real-world issues that only surface when actually run — the same as any new deployment guide for any project.

## Prerequisites

- Node.js 22+
- pnpm (via `corepack enable`)
- A real Postgres 16+ instance
- Docker + Docker Compose (for the containerized path)
- A real credential for at least one AI provider (e.g. an Anthropic API key) if you want Agent Manager's `invoke` endpoint to actually call a model

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes | Postgres connection string |
| `PORT` | Yes | api-server listen port |
| `BASE_PATH` | Yes | frontend build base path (Vite configs read this) |
| `JWT_SECRET` | Yes | auth token signing (see existing `middleware/auth.ts`) |
| `LOG_LEVEL` | No | pino log level, default `info` |
| `NODE_ENV` | No | set to `production` in prod (disables pino-pretty transport) |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | No | if set, traces export here instead of stdout |
| Provider-specific (e.g. an Anthropic key) | No | referenced by name from a `provider_configs` row's `apiKeyEnvVar`, never stored in the database |

## Database setup

```bash
pnpm install
pnpm --filter @workspace/db run push   # applies all 21 tables to DATABASE_URL
```

This has not been run against a live database in this session — do this first, before starting the api-server, or every store operation will fail at first query.

## Local (non-Docker) run

```bash
pnpm install
PORT=5000 BASE_PATH=/ DATABASE_URL=<real-url> JWT_SECRET=<real-secret> pnpm run build
PORT=5000 DATABASE_URL=<real-url> JWT_SECRET=<real-secret> node artifacts/api-server/dist/index.mjs
```

## Docker

```bash
# Build
docker build -t octopus-os-api-server .

# Or via compose (brings up Postgres too):
cp .env.example .env   # create this — see docker-compose.prod.yml's header comment for required vars
docker compose -f docker-compose.prod.yml up -d --build

# First run only — push the schema:
docker compose -f docker-compose.prod.yml run --rm api-server \
  pnpm --filter @workspace/db run push
```

See `Dockerfile`'s header comment for the multi-stage build explanation, and `docker-compose.prod.yml`'s header comment for the secrets/first-run notes. Neither has been executed in this environment (no Docker daemon reachable) — verify locally before trusting in production.

## CI/CD

`.github/workflows/ci.yml` runs `pnpm install && pnpm run typecheck && pnpm run test && pnpm run build` on every push/PR to `main`. This is the exact verification sequence used manually after every module in this project. **No CD (continuous deployment) pipeline exists** — there's no deployment target configured to deploy to. Adding one is a straightforward follow-up (a second job in the same workflow, or a separate `cd.yml`, building the Docker image and pushing it to a registry / triggering a deploy) once a real target (a cloud provider, a registry, an orchestrator) is chosen — that choice hasn't been made and shouldn't be assumed.

## Health, metrics, and tracing endpoints

- `GET /api/healthz` — liveness (unauthenticated).
- `GET /api/metrics` — Prometheus scrape endpoint (unauthenticated, standard for scrapers).
- `GET /api/system/status` — aggregated module-level health snapshot (admin-only, richer than a liveness probe).
- Traces print to stdout by default; set `OTEL_EXPORTER_OTLP_ENDPOINT` to ship them to a real collector (Jaeger, Tempo, a vendor endpoint, etc.) — untested against a live collector here.

## Backup strategy (documented, not exercised)

- **Database**: standard Postgres backup practice applies unchanged — `pg_dump`/continuous WAL archiving/managed-provider automated backups, whichever your Postgres hosting provides. Nothing in this codebase changes standard Postgres backup/restore procedure.
- **What's safe to lose vs. not**: `events`, `brain_decisions`, `agent_runs`, `workflow_runs`, `scheduled_job_runs`, `notification_deliveries`, `audit_log` are append-only historical records — losing recent writes loses history, not correctness of ongoing operation. `agents`, `tools`, `workflow_definitions`, `rule_definitions`, `scheduled_jobs`, `provider_configs`, `notification_channels`, `settings` are configuration — losing these means reconfiguring the system, which is more disruptive than losing history.
- **Not implemented**: automated backup scheduling, point-in-time-recovery tooling, or a restore runbook specific to this schema. This is real, scoped future work — see `NEXT_PHASE_RECOMMENDATIONS.md`.

## Disaster recovery (documented, not exercised)

No DR drill has been run (no staging environment exists here to fail over). The architecture's DR-relevant properties, as designed:
- Single Postgres instance is a single point of failure today — no read replica, no multi-region setup configured.
- `Scheduler` and `TaskQueue.reclaimStale()` both assume a single api-server process; running multiple replicas without the documented distributed-lock gaps (see `replit.md` Gotchas) could double-fire scheduled jobs or double-process stale tasks in a failover scenario.
- Recovery from a lost database, assuming standard Postgres backup/restore, is: restore the backup, run `pnpm --filter @workspace/db run push` to reconcile schema if the backup predates a schema change, restart the api-server.

## Rollback

Standard practice: keep the previous Docker image tag available, redeploy it, and — if a schema migration was involved — ensure the previous code version is compatible with the current schema (Drizzle's `push` is not a versioned migration tool; see Known Issues in `SNAPSHOT_STATUS.md` about migration verification being a real gap).
