# OCTOPUS OS — Next Steps

## Current state

Module 14 (Settings) is complete, verified (typecheck/tests/build all green), documented, and committed. No module is left half-finished.

## Immediate next task

There are two legitimate candidates for "next," and picking between them is itself the first thing to decide — see `SNAPSHOT_STATUS.md`'s "Known issues" #8 for why neither should be started casually:

1. **Multi-tenancy.** This is the bigger, riskier one. A real implementation means:
   - A `tenants` table.
   - A `tenantId` column added to every existing table that holds tenant-scoped data (roughly 15 of the 21 tables — everything except `users` itself, depending on whether users can belong to multiple tenants).
   - Every store's `list()`/`get()`/etc. across every module gaining a `tenantId` filter.
   - Every route gaining tenant-scoping logic (where does `tenantId` come from — a header? part of the JWT? a subdomain?).
   - This touches **every already-completed module's store layer**, which is exactly the kind of cross-cutting, high-risk change the project rules say requires an explicit decision before starting, not silent execution. **Do not start this without first confirming: (a) how a tenant is identified per-request, (b) whether existing data needs a migration/backfill strategy, (c) whether this is additive (nullable `tenantId`, opt-in) or a hard requirement everywhere.**

2. **Internationalization (i18n).** Smaller blast radius on the backend (mostly: translate error messages, maybe support `Accept-Language`), but the real work is in the two frontends (`artifacts/octopus-os`, `artifacts/mockup-sandbox`), which have had no i18n work done at all — no message catalog, no locale switching, no translated strings. Confirm scope before starting: is this "translate the existing UI strings" or "build the infrastructure for translation with English as the only shipped locale for now"?

**Recommendation:** if forced to pick one to start on unprompted, i18n's backend half (an `Accept-Language`-aware error message layer, using the `user`-scope `Settings` module already built for a `locale` preference) is lower-risk and doesn't touch any existing module's data model. Multi-tenancy should not be started without explicit confirmation of the three questions above.

## Remaining roadmap (in the order a rational implementer would tackle it)

1. Confirm scope/design for multi-tenancy and i18n (see above) — a design conversation, not code.
2. Implement whichever is confirmed first, as its own reviewed unit of work, following the same per-module workflow as every module before it (design → implement → integrate → typecheck → test → build → docs → commit).
3. Implement the other.
4. **Codegen pass**: once network access is available, run `pnpm --filter @workspace/api-spec run codegen` and migrate all 13 hand-rolled route validators (`system-events.ts` through `settings.ts`) to the generated Zod schemas. This can happen independently of 1–3 and has no ordering dependency on them.
5. **Database push**: run `pnpm --filter @workspace/db run push` against a real `DATABASE_URL` once one exists, to actually create all 21 tables.
6. **Credential wiring**: set a real `ANTHROPIC_API_KEY`-equivalent env var and create a real `provider_configs` row referencing it, to exercise `AnthropicProviderClient` end-to-end for the first time.
7. **Integration test pass**: a real HTTP-level test suite against a running api-server + live Postgres, complementing (not replacing) the existing unit tests.
8. **CI**: add `.github/workflows` (or equivalent) running typecheck/test/build on every push, so the manual verification discipline used for every module so far becomes automatic.
9. Only after 1–8 (or an explicit decision to defer some of them): the final wrap-up sequence — full verification, dead code removal, dependency graph re-check, final ZIP, `FINAL_COMPLETION_REPORT.md`.

## Required implementation order / dependencies between modules

No new module is currently planned that depends on another new module in a way that dictates order — multi-tenancy and i18n are both cross-cutting and could technically proceed in either order. However:

- **Multi-tenancy, if implemented, should land before any further modules are added**, since every module built after it would need to be tenant-aware from the start, whereas every module built *before* it needs to be retrofitted once.
- **i18n's backend half has a soft dependency on `Settings`** (already built) for storing a user's locale preference — no new dependency needs to be added, `Settings` already supports arbitrary keys like `locale`.
- Everything else in the roadmap above (codegen, db push, credentials, integration tests, CI) is independent and can be done in any order, including in parallel with 1–3.
