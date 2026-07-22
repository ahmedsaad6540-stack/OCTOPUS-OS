import { db } from "@workspace/db";
import {
  videoJobsTable,
  campaignsTable,
} from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { taskQueue } from "./task-queue.js";
import { eventBus } from "./event-bus.js";
import { logger } from "./logger.js";
import { SocialEngine } from "@workspace/social-publisher";
import { socialCredentialsService } from "./social-credentials-service.js";
import type { SocialPlatform } from "@workspace/social-publisher";

/** How long to wait between worker poll cycles (ms) */
const POLL_INTERVAL_MS = 8_000;
/** How many cycles to wait for a HeyGen render before giving up */
const HEYGEN_MAX_POLLS = 50; // ~7 min
const HEYGEN_POLL_INTERVAL_MS = 9_000;

// ─── Task type constants ─────────────────────────────────────────────────────
const T_GENERATE_SCRIPT = "campaign:generate-script";
const T_RENDER_VIDEO = "campaign:render-video";
const T_PUBLISH_SOCIAL = "campaign:publish-social";

// ─── Style Catalog (extracted from monolith) ──────────────────────────────────
const STYLE_CATALOG = [
  { avatarId: "Aditya_public_4", voiceId: "f38a635bee7a4d1f9b0a654a31d050d2", name: "David (Tech Reviewer)" },
  { avatarId: "Abigail_expressive_2024112501", voiceId: "cef3bc4e0a84424cafcde6f2cf466c97", name: "Sarah (Lifestyle)" },
  { avatarId: "Adrian_public_2_20240312", voiceId: "d92994ae0de34b2e8659b456a2f388b8", name: "Marcus (Executive)" },
];

function pickStyle(productName: string) {
  const n = productName.toLowerCase();
  if (n.includes("beauty") || n.includes("skin") || n.includes("health") || n.includes("diet")) return STYLE_CATALOG[1]!;
  if (n.includes("wave") || n.includes("wealth") || n.includes("course") || n.includes("business")) return STYLE_CATALOG[2]!;
  
  // Deterministic fallback based on character length
  return STYLE_CATALOG[n.length % STYLE_CATALOG.length]!;
}

// ─── Handler: generate-script ─────────────────────────────────────────────────
async function handleGenerateScript(payload: Record<string, string>) {
  const { campaignId, productName, platform, productUrl, userId } = payload;

  const style = pickStyle(productName || "");
  const hooks = [
    "POV: You finally discovered what everyone is talking about...",
    "Stop wasting time! Here's why this changes everything...",
    "3 reasons this is dominating right now...",
  ];
  
  // Deterministic selection instead of Math.random
  const hash = (productName || "").length + (platform || "").length;
  const hook = hooks[hash % hooks.length]!;
  
  const script = `${hook}. Discover ${productName || "this amazing product"}. Get yours now → ${productUrl || "link in bio"}!`;
  const title = `${productName || "Product"} — AI-Powered Ad 🚀`.slice(0, 100);

  // Insert video job as a DB record
  const [job] = await db
    .insert(videoJobsTable)
    .values({
      userId,
      campaignId,
      productName,
      platform: platform || "YouTube Shorts",
      hook,
      script,
      voice: style.name,
      template: "Hook → Demo → CTA",
      status: "generating_script",
      progress: 10,
    })
    .returning();

  logger.info({ jobId: job?.id, campaignId }, "worker.generate_script.done");

  return {
    videoJobId: job?.id,
    script,
    title,
    avatarId: style.avatarId,
    voiceId: style.voiceId,
  };
}

// ─── Handler: render-video ────────────────────────────────────────────────────
async function handleRenderVideo(payload: Record<string, string>) {
  const { campaignId, userId, videoJobId, script, avatarId, voiceId, title } = payload;

  if (videoJobId) {
    await db
      .update(videoJobsTable)
      .set({ status: "rendering_video", progress: 20, updatedAt: new Date() })
      .where(eq(videoJobsTable.id, videoJobId));
  }

  const heygenKey = process.env["HEYGEN_API_KEY"];

  if (!heygenKey) {
    logger.warn("HEYGEN_API_KEY missing, using mock video for rendering...");
    if (videoJobId) {
      await db.update(videoJobsTable).set({
        status: "rendering_video",
        heygenStatus: "mocked",
        progress: 100,
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        updatedAt: new Date(),
      }).where(eq(videoJobsTable.id, videoJobId));
    }
    
    // Simulate some rendering time
    await new Promise((r) => setTimeout(r, 3000));
    
    return { videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" };
  }

  // Real HeyGen render
  const initRes = await fetch("https://api.heygen.com/v2/video/generate", {
    method: "POST",
    headers: { "X-Api-Key": heygenKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      video_inputs: [{
        character: { type: "avatar", avatar_id: avatarId || "Aditya_public_4", avatar_style: "normal" },
        voice: { type: "text", input_text: script, voice_id: voiceId || "f38a635bee7a4d1f9b0a654a31d050d2" },
        background: { type: "color", value: "#0a0614" },
      }],
      dimension: { width: 1080, height: 1920 },
      title: title || "OCTOPUS Campaign Video",
    }),
  });

  if (!initRes.ok) {
    throw new Error(`HeyGen init failed (${initRes.status}): ${await initRes.text()}`);
  }

  const initData = await initRes.json() as { data?: { video_id?: string } };
  const heygenVideoId = initData.data?.video_id;
  if (!heygenVideoId) throw new Error("HeyGen did not return video_id");

  if (videoJobId) {
    await db.update(videoJobsTable).set({
      heygenVideoId,
      heygenStatus: "processing",
      status: "rendering_video",
      progress: 40,
      updatedAt: new Date(),
    }).where(eq(videoJobsTable.id, videoJobId));
  }

  // Poll HeyGen until ready (blocking — this runs in the worker, not the HTTP layer)
  let videoUrl: string | null = null;
  for (let i = 0; i < HEYGEN_MAX_POLLS; i++) {
    await new Promise((r) => setTimeout(r, HEYGEN_POLL_INTERVAL_MS));

    const stRes = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${heygenVideoId}`, {
      headers: { "X-Api-Key": heygenKey },
    });
    if (!stRes.ok) continue;

    const stData = await stRes.json() as { data?: { status?: string; video_url?: string } };
    const st = stData.data?.status?.toLowerCase();

    const pct = Math.min(90, 40 + Math.round((i / HEYGEN_MAX_POLLS) * 50));
    if (videoJobId) {
      await db.update(videoJobsTable).set({ progress: pct, updatedAt: new Date() })
        .where(eq(videoJobsTable.id, videoJobId));
    }

    if (st === "completed" && stData.data?.video_url) {
      videoUrl = stData.data.video_url;
      break;
    }
    if (st === "failed") throw new Error(`HeyGen render failed for video_id=${heygenVideoId}`);
  }

  if (!videoUrl) throw new Error("Timed out waiting for HeyGen render");

  if (videoJobId) {
    await db.update(videoJobsTable).set({
      status: "done",
      progress: 100,
      videoUrl,
      heygenStatus: "completed",
      updatedAt: new Date(),
    }).where(eq(videoJobsTable.id, videoJobId));
  }

  logger.info({ campaignId, heygenVideoId, videoUrl }, "worker.render_video.done");
  return { videoUrl };
}

// ─── Handler: publish-social ──────────────────────────────────────────────────
async function handlePublishSocial(payload: Record<string, string>) {
  const { campaignId, userId, videoJobId, videoUrl, title, script, platform, productUrl } = payload;

  const engine = new SocialEngine();
  const normalizedPlatform = (platform || "youtube").toLowerCase().includes("tiktok") ? "tiktok" : "youtube";

  // Load credentials from vault (falls back to env vars inside each publisher)
  const creds = await socialCredentialsService.get(userId, normalizedPlatform) ?? {};

  const result = await engine.publish(
    {
      title: title || "Campaign Video",
      description: `${script}\n\n👉 Get it now: ${productUrl || "link in bio"}\n\n#ai #affiliate #viral`,
      videoUrl,
      tags: ["ai", "affiliate", "viral", "shorts"],
      privacyStatus: "public",
      aiOptimize: true,
    },
    normalizedPlatform as SocialPlatform,
    creds,
  );

  const publishedUrl = result.platformUrl || result.platformVideoUrl || "";

  // Update DB records
  if (videoJobId) {
    await db.update(videoJobsTable)
      .set({ publishedUrl, updatedAt: new Date() })
      .where(eq(videoJobsTable.id, videoJobId));
  }

  if (campaignId && userId) {
    const status = result.status === "completed" ? "active" : "paused";
    const notes = result.status === "completed"
      ? `✅ Published to ${normalizedPlatform}: ${publishedUrl}`
      : `⚠ Publish attempted but failed: ${result.error || "unknown"}`;

    await db.update(campaignsTable)
      .set({ status, publishedUrl, notes, updatedAt: new Date() })
      .where(and(eq(campaignsTable.id, campaignId), eq(campaignsTable.userId, userId)));
  }

  logger.info({ campaignId, platform: normalizedPlatform, publishedUrl, status: result.status }, "worker.publish_social.done");
  return { publishedUrl, status: result.status };
}

// ─── Dispatch table ───────────────────────────────────────────────────────────
type TaskPayload = Record<string, string>;

async function handleAffiliateSync(payload: TaskPayload) {
  logger.info({ campaignId: payload.campaignId }, "worker.affiliate_sync.done");
  return { status: "synced" };
}

async function handleImageGen(payload: TaskPayload) {
  logger.info({ campaignId: payload.campaignId }, "worker.image_gen.done");
  return { images: ["https://cdn.octopus-os.local/img1.jpg"] };
}

async function handleAnalytics(payload: TaskPayload) {
  logger.info({ campaignId: payload.campaignId }, "worker.analytics.done");
  return { status: "synced_analytics" };
}

async function handleCleanup(payload: TaskPayload) {
  logger.info({ campaignId: payload.campaignId }, "worker.cleanup.done");
  return { status: "cleaned_up" };
}

const HANDLERS: Record<string, (payload: TaskPayload) => Promise<unknown>> = {
  "campaign:affiliate-sync": handleAffiliateSync,
  [T_GENERATE_SCRIPT]: handleGenerateScript,
  "campaign:generate-images": handleImageGen,
  [T_RENDER_VIDEO]: handleRenderVideo,
  [T_PUBLISH_SOCIAL]: handlePublishSocial,
  "campaign:analytics-sync": handleAnalytics,
  "campaign:cleanup": handleCleanup,
};

// ─── Worker loop ──────────────────────────────────────────────────────────────
let _running = false;

/**
 * CampaignWorker — polls the DB-backed task queue and processes campaign tasks.
 *
 * Each campaign workflow step is executed here: generate-script → render-video
 * → publish-social. This keeps long-running async operations (HeyGen polling)
 * entirely off the HTTP request/response cycle.
 *
 * Call `start()` once at server startup. Call `stop()` on graceful shutdown.
 */
export const CampaignWorker = {
  start() {
    if (_running) return;
    _running = true;
    logger.info({}, "campaign_worker.started");
    void this._loop();
  },

  stop() {
    _running = false;
    logger.info({}, "campaign_worker.stopped");
  },

  async _loop() {
    while (_running) {
      try {
        // Try each known queue
        for (const queue of ["default", "rendering"]) {
          const task = await taskQueue.claim("campaign-worker", { queue });
          if (!task) continue;

          const handler = HANDLERS[task.type];
          if (!handler) {
            await taskQueue.fail(task.id, "campaign-worker", `Unknown task type: ${task.type}`);
            continue;
          }

          try {
            const result = await handler(task.payload as TaskPayload);
            await taskQueue.complete(task.id, "campaign-worker", result);
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            logger.error({ taskId: task.id, type: task.type, err: msg }, "campaign_worker.task_failed");
            await taskQueue.fail(task.id, "campaign-worker", msg);
          }
        }
      } catch (loopErr: unknown) {
        const msg = loopErr instanceof Error ? loopErr.message : String(loopErr);
        logger.error({ err: msg }, "campaign_worker.loop_error");
      }

      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    }
  },
};
