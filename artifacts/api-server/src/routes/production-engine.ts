/**
 * production-engine.ts
 *
 * Refactored from the monolithic 638-line file into a clean Route Layer.
 *
 * Responsibilities (ONLY):
 *  - Validate the HTTP request
 *  - Authorize the user
 *  - Delegate work to the appropriate Service (CampaignWorkflowService,
 *    WorkflowEngine, DB queries)
 *  - Return an HTTP response
 *
 * The campaign pipeline (generate-script → render-video → publish-social)
 * is now orchestrated by CampaignWorkflowService + WorkflowEngine and
 * executed by CampaignWorker in the background.
 * Routes are NOT responsible for HeyGen polling, social publishing, or
 * any long-running async operation.
 */

import { Router } from "express";
import { db } from "@workspace/db";
import { videoJobsTable, campaignsTable, productionLogsTable } from "@workspace/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";
import { campaignWorkflowService } from "../lib/campaign-workflow-service.js";
import { workflowEngine } from "../lib/workflow-engine.js";
import { logger } from "../lib/logger.js";
import { videoEngine } from "../services/video/VideoEngine.js";

const router = Router();

// ─── Helper ───────────────────────────────────────────────────────────────────

/** Write a structured log line to productionLogsTable (best-effort). */
export async function logOp(
  userId: string | null | undefined,
  entityType: string,
  entityId: string,
  action: string,
  provider: string,
  status: string,
  details = "",
  stack = "",
  suggestedFix = "",
) {
  try {
    await db.insert(productionLogsTable).values({
      userId: userId || null,
      entityType,
      entityId,
      action,
      provider,
      status,
      details,
      stack,
      suggestedFix,
    });
  } catch (e) {
    logger.error({ err: e }, "logOp.write_failed");
  }
}

// ─── 1. POST /api/production/generate-video-batch ────────────────────────────
// Creates video production jobs. For each job a task is enqueued and
// processed by CampaignWorker asynchronously.

router.post("/generate-video-batch", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  const {
    productName = "Product Ad",
    platform = "YouTube Shorts",
    count = 1,
  } = req.body as { productName?: string; platform?: string; count?: number };

  try {
    const actualCount = Math.min(Math.max(Number(count) || 1, 1), 10);
    const hooks = [
      "POV: You finally discovered what everyone is talking about...",
      "Stop wasting hours! Look at this in 10 seconds...",
      "3 reasons why this is dominating 2026...",
      "I tested 15 solutions and this one blew me away...",
      "Don't buy anything else until you watch this...",
    ];

    const batchJobs: unknown[] = [];

    for (let i = 0; i < actualCount; i++) {
      const hook = hooks[i % hooks.length]!;
      const script = `${hook} Discover ${productName}. Get yours now!`;

      const [job] = await db.insert(videoJobsTable).values({
        userId,
        productName,
        platform,
        hook,
        script,
        voice: "Auto-Select",
        template: "Hook → Demo → CTA",
        status: "queued",
        progress: 0,
      }).returning();

      if (job) batchJobs.push(job);
    }

    // Process jobs asynchronously
    setTimeout(async () => {
      console.log(`[VideoBatch] Starting async video generation for ${batchJobs.length} jobs`);
      
      for (const job of batchJobs as any[]) {
        try {
          console.log(`[VideoBatch] Rendering job ${job.id}`);
          await db.update(videoJobsTable).set({ status: "rendering_video", progress: 50 }).where(eq(videoJobsTable.id, job.id));
          const videoUrl = await videoEngine.renderVideo(
            { title: job.productName, hook: job.hook, body: [job.script], callToAction: "Link in bio" },
            []
          );
          console.log(`[VideoBatch] Finished rendering job ${job.id}. Video URL: ${videoUrl}`);
          await db.update(videoJobsTable).set({ status: "done", progress: 100, videoUrl, updatedAt: new Date() }).where(eq(videoJobsTable.id, job.id));
        } catch (e: any) {
          console.error(`[VideoBatch] Async video generation failed for job ${job.id}`, e);
          await db.update(videoJobsTable).set({ status: "failed", errorMessage: e?.message || String(e), progress: 0 }).where(eq(videoJobsTable.id, job.id));
        }
      }
    }, 1000);


    await logOp(userId, "video_batch", "", "batch_queued", "OCTOPUS", "success",
      `Queued ${actualCount} production jobs for ${productName}`);

    res.status(201).json({ success: true, jobs: batchJobs });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    await logOp(userId, "video_batch", "", "batch_error", "OCTOPUS", "error", msg);
    req.log.error(err);
    res.status(500).json({ success: false, error: msg });
  }
});

// ─── 2. GET /api/production/jobs ─────────────────────────────────────────────
// Returns production jobs for the current user.
// HeyGen polling is now handled exclusively by CampaignWorker.

router.get("/jobs", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  try {
    const jobs = await db
      .select()
      .from(videoJobsTable)
      .where(eq(videoJobsTable.userId, userId))
      .orderBy(desc(videoJobsTable.createdAt))
      .limit(300);

    res.json({ success: true, jobs });
  } catch (err: unknown) {
    req.log.error(err);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// ─── 3. POST /api/production/launch-campaign/:id ─────────────────────────────
// Triggers the full campaign pipeline via WorkflowEngine.
// Returns 202 Accepted immediately with the workflowRunId.
// Actual work (HeyGen, social publish) happens in CampaignWorker.

router.post("/launch-campaign/:id", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  const { id } = req.params as { id: string };

  try {
    const [campaign] = await db
      .select()
      .from(campaignsTable)
      .where(and(eq(campaignsTable.id, id), eq(campaignsTable.userId, userId)));

    if (!campaign) {
      res.status(404).json({ success: false, error: "Campaign not found" });
      return;
    }

    // Launch the workflow asynchronously
    const run = await campaignWorkflowService.launch(campaign, userId);

    await logOp(userId, "campaign", campaign.id, "launch_triggered", "OCTOPUS", "success",
      `Workflow run started: ${run.id}`);

    // 202 Accepted — workflow is running in the background
    res.status(202).json({
      success: true,
      message: "Campaign pipeline started. Check workflowRunId for progress.",
      workflowRunId: run.id,
      status: run.status,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    req.log.error(err);
    await logOp(userId, "campaign", id, "launch_error", "OCTOPUS", "error", msg);
    res.status(500).json({ success: false, error: msg });
  }
});

// ─── 4. GET /api/production/workflow-run/:runId ───────────────────────────────
// Poll the status of a workflow run (non-blocking, real-time status).

router.get("/workflow-run/:runId", requireAuth, async (req: AuthRequest, res) => {
  const { runId } = req.params as { runId: string };
  try {
    const run = await workflowEngine.getRun(runId);
    if (!run) {
      res.status(404).json({ success: false, error: "Workflow run not found" });
      return;
    }
    res.json({ success: true, run });
  } catch (err: unknown) {
    req.log.error(err);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// ─── 5. GET /api/production/logs ─────────────────────────────────────────────

router.get("/logs", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  try {
    const logs = await db
      .select()
      .from(productionLogsTable)
      .where(eq(productionLogsTable.userId, userId))
      .orderBy(desc(productionLogsTable.createdAt))
      .limit(500);
    res.json({ success: true, logs });
  } catch (err: unknown) {
    req.log.error(err);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// ─── 6. DELETE /api/production/jobs/:id ──────────────────────────────────────

router.delete("/jobs/:id", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  const { id } = req.params as { id: string };
  try {
    await db
      .delete(videoJobsTable)
      .where(and(eq(videoJobsTable.id, id), eq(videoJobsTable.userId, userId)));
    await logOp(userId, "video_job", id, "delete_job", "OCTOPUS", "success", `Deleted job ${id}`);
    res.json({ success: true });
  } catch (err: unknown) {
    req.log.error(err);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// ─── 7. DELETE /api/production/jobs ──────────────────────────────────────────

router.delete("/jobs", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  try {
    await db.delete(videoJobsTable).where(eq(videoJobsTable.userId, userId));
    await logOp(userId, "video_jobs", "", "clear_all_jobs", "OCTOPUS", "success", "Cleared all jobs");
    res.json({ success: true });
  } catch (err: unknown) {
    req.log.error(err);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

export default router;
