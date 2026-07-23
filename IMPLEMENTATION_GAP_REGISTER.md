# Implementation Gap Register

## Phase C4: AI and Video
- **Video Rendering Engine**: `VideoEngine.ts` contains a mock `renderVideo` method returning a static `.mp4` URL. It does not integrate with Remotion or FFmpeg to stitch images, voiceovers, and text into a real video.
- **Voiceover (TTS)**: No integration exists for text-to-speech services (e.g., ElevenLabs or OpenAI TTS) within the VideoFactory.

## Phase C5: Autonomous Campaign Operations
- **Persistent Orchestration**: `CampaignOrchestrator.ts` executes state transitions synchronously or via untracked asynchronous calls. It does not interface with the durable `tasksTable` (from `lib/task-queue`) to enqueue jobs, nor does it implement dead-letter mechanisms or exponential backoff for media generation retries.
- **Worker Processes**: There are no background workers polling `tasksTable` for campaign steps.

## Phase C6: Social Platforms
- **TikTok Direct/Draft Post**: Mocks returning hardcoded success messages. No real integration with TikTok OAuth or API endpoints.
- **YouTube OAuth**: Entirely mocked in `youtube-router.ts`. Does not implement Google APIs (`googleapis`), token refresh logic, or real video upload capabilities.
- **Meta Graph API**: Entirely mocked in `meta-router.ts`. No Facebook/Instagram Reels API logic.

## Phase C7 & C8: Security and Billing
- **RBAC & Isolation Tests**: `RBAC.test.ts` only asserts strings. It does not test real multi-tenant database row-level security or query filtering.
- **Payment Gateway**: `BillingEngine.ts` updates a local database table but lacks webhook endpoints to synchronize with Stripe, nor does it have real logic for plan upgrades/cancellations.

## Phase C9: CI Validation
- **Database Provisioning**: The `.github/workflows/ci.yml` file is a generic Node.js template. It lacks services for PostgreSQL (`postgres:15`) or Redis, meaning any real integration tests will fail on CI.
- **Test Execution**: The CI workflow does not execute Playwright tests properly (missing browser installation steps).
