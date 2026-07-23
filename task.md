# Phase C3.2 Pre-Live Validation Task List

- [x] 1. Persistent Campaign Drafts
  - [x] Add `affiliate_campaign_drafts` to Drizzle schema.
  - [x] Generate database migration.
  - [x] Rewrite API endpoints to use Postgres.
  - [x] Ensure frontend relies on DB and cleans up `sessionStorage`.

- [x] 2. Digistore24 Interactive API-Key Flow & Disconnect
  - [x] Implement `/request-token` with one-time state mapping.
  - [x] Implement `/callback` to retrieve, encrypt, and test key.
  - [x] Implement `/disconnect` calling unregister and deleting secrets.
  - [x] Refactor `DigistoreProvider` HTTP to use `X-DS-API-KEY`.
  - [x] Add manual fallback UI and interactive flow UI to frontend.

- [ ] 3. Isolated PostgreSQL Test Gate
  - [ ] Create `scripts/test-db-real.ts`.
  - [ ] Load `TEST_DATABASE_URL` from `.env.test.local` safely.
  - [ ] Apply migration via `drizzle-kit migrate`.
  - [ ] Validate schema metadata and output JSON evidence.

- [ ] 4. Real Restart Validation
  - [ ] Write `scripts/test-api-restart.ts`.
  - [ ] Spawn API process, insert records via HTTP.
  - [ ] Restart process, retrieve records via HTTP.
  - [ ] Generate JSON evidence.

- [ ] 5. Credential Lifecycle Test
  - [ ] Write `scripts/test-credential-lifecycle.ts`.
  - [ ] Create, encrypt, store, replace, revoke, and delete sequence.
  - [ ] Verify zero plaintext leaks and RBAC bounds.
  - [ ] Generate JSON evidence.

- [ ] 6. Playwright Execution
  - [ ] Update `e2e/affiliate.spec.ts` with the 18-step requirements.
  - [ ] Run Playwright and output JUnit/JSON evidence.

- [ ] 7. Final Clean Validation
  - [ ] Create `scripts/validate-all.ts` combining all 17 steps.
  - [ ] Execute suite and ensure zero leaks and exit code 0.
  - [ ] Update status report.
