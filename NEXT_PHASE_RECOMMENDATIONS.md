# OCTOPUS OS — Next Phase Recommendations

Ordered by what unblocks the most other work first.

## 1. Get this running against real infrastructure

Nothing in this repository has been executed against a live Postgres, a live Docker daemon, a live CI runner, or a live AI provider credential. This is the single highest-value next step — it will surface real issues (connection pooling behavior, migration edge cases, whether the OpenTelemetry bundling limitation actually manifests in practice) that no amount of further code-writing here can. Concretely:
- Provision a real Postgres, run `pnpm --filter @workspace/db run push`.
- Set a real `ANTHROPIC_API_KEY`-equivalent, create a `provider_configs` row, invoke a real agent.
- Push this repo to GitHub, let `.github/workflows/ci.yml` actually run.
- `docker build`/`docker compose up` for real.

## 2. Design and scope multi-tenancy — before writing any code for it

Don't start with an implementation. Start with three questions: how is a tenant identified per request (header, subdomain, JWT claim)? Is `tenantId` additive/nullable or a hard requirement retrofitted onto all ~15 tenant-scoped tables? What's the migration path for whatever data already exists? Only after those are answered does implementation become a bounded, safe piece of work rather than an open-ended one touching every module's store and routes.

## 3. Design and scope i18n

Similarly: decide whether this is "translate existing strings" or "build translation infrastructure with English as the only shipped locale." The backend half (locale-aware error messages) has a natural home already — `Settings`'s `user` scope can store a `locale` preference with zero new module needed. The frontend half is genuinely greenfield in both `artifacts/octopus-os` and `artifacts/mockup-sandbox`.

## 4. Codegen migration

Once network access is available: run `pnpm --filter @workspace/api-spec run codegen`, then migrate all ~13 hand-rolled route validators to the generated Zod schemas. This removes the largest piece of "temporary substitute" code in the repository.

## 5. Integration and end-to-end test coverage

Unit tests are strong (202 passing) but entirely in-memory. Add: a `Drizzle*Store` test suite per module against a real (even ephemeral/testcontainers) Postgres, and a `supertest` integration suite against the real Express app. See `FINAL_TEST_REPORT.md` for specifics.

## 6. The one concrete performance fix already identified

`ObservabilityService.getStatus()` awaits its ~10 registered probes sequentially. Parallelize with `Promise.allSettled` (not plain `Promise.all`, to preserve "one probe's failure doesn't affect others") — a small, well-scoped, high-value fix. See `FINAL_PERFORMANCE_REPORT.md`.

## 7. Security follow-ups

In priority order: configure `app.set("trust proxy", ...)` correctly for your actual deployment topology before trusting the rate limiter's IP detection; tighten CORS from `origin: true` to an explicit allowlist; add dependency vulnerability scanning (Dependabot or equivalent); decide whether/how to migrate the legacy `providers` table (raw stored API keys) onto the real `provider_configs` pattern. See `FINAL_SECURITY_REPORT.md`.

## 8. CD pipeline

No deployment target has been chosen, so none was assumed. Once one is (a cloud provider, a container registry, an orchestrator), add a second CI job or a separate workflow that builds the Docker image, pushes it, and triggers a deploy — the CI job already in place is a solid foundation to extend.

## 9. Broader instrumentation

If deeper OpenTelemetry spans (Express route level, Postgres query level) turn out to matter in practice, add `express` and `pg` to `build.mjs`'s `external` list so their instrumentation can actually patch the real, unbundled modules — a scoped, well-understood follow-up to the tracing work already done, not a redesign of it.

## 10. Frontend work

Neither `artifacts/octopus-os` nor `artifacts/mockup-sandbox` has any UI for the 14 modules built in this phase — everything so far is API-only. Building real UI for agents, workflows, rules, tools, the notification inbox, etc. is a substantial, separate body of work, following whatever this project's frontend conventions turn out to be.
