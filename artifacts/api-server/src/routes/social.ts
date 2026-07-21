import { Router } from "express";
import { db } from "@workspace/db";
import { socialAccountsTable, usersTable, campaignsTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";
import { SocialEngine, type AccountTarget, type SocialPlatform } from "@workspace/social-publisher";
import { TikTokPublishingRouter, type TikTokPublishingJob } from "../services/tiktok-router.js";

const router = Router();
const socialEngine = new SocialEngine();

// Helper to resolve user ID for agent calls or authenticated calls
async function resolveUserId(req: AuthRequest): Promise<string> {
  if (req.user?.userId) return req.user.userId;
  try {
    const [admin] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, "admin1@octopus.ai"))
      .limit(1);
    return admin ? admin.id : "admin-default";
  } catch (err) {
    return "admin-default";
  }
}

router.get("/social/launch-pack/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    // Get campaign details
    const [campaign] = await db
      .select()
      .from(campaignsTable)
      // @ts-expect-error Drizzle type mismatch
      .where(and(eq(campaignsTable.id, id), eq(campaignsTable.userId, req.user!.userId)))
      .limit(1);
      
    if (!campaign) {
      res.status(404).json({ error: "Campaign not found" });
      return;
    }

    const job: TikTokPublishingJob = {
      campaignId: campaign.id,
      userId: campaign.userId,
      videoUrl: campaign.videoId || "https://example.com/dummy.mp4",
      title: campaign.name || "My Campaign",
      description: campaign.name || "My Campaign Description",
      hashtags: ["#octopus", "#ai"]
    };
    
    const result = await TikTokPublishingRouter.routeJob(job, {
      hasDirectPost: false,
      hasDraftUpload: false,
      isConnected: false
    });
    
    const anyResult = result as any;
    if (anyResult.mode === "launch_pack" && anyResult.packageId) {
       // Just read the zip and send it to the client
       const fs = require('fs');
       const path = require('path');
       const zipPath = path.resolve(__dirname, `../../public/packages/${anyResult.packageId}.zip`);
       
       if (fs.existsSync(zipPath)) {
         res.download(zipPath);
         return;
       }
    }
    
    res.status(500).json({ error: "Failed to generate Launch Pack", result });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
// 1. GET /social - List all social accounts for user
router.get("/social", requireAuth, async (req: AuthRequest, res) => {
  try {
    const rows = await db
      .select()
      .from(socialAccountsTable)
      .where(eq(socialAccountsTable.userId, req.user!.userId));
    res.json({ accounts: rows });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 2. POST /social - Create social account entry manually or via integration
router.post("/social", requireAuth, async (req: AuthRequest, res) => {
  try {
    const body = req.body as Partial<typeof socialAccountsTable.$inferInsert>;
    const [row] = await db
      .insert(socialAccountsTable)
      .values({ ...body, userId: req.user!.userId } as typeof socialAccountsTable.$inferInsert)
      .returning();
    res.status(201).json({ account: row });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 3. PUT /social/:id - Update social account
router.put("/social/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params as { id: string };
    const body = req.body as Partial<typeof socialAccountsTable.$inferInsert>;
    const [row] = await db
      .update(socialAccountsTable)
      .set({ ...body, updatedAt: new Date() })
      .where(and(eq(socialAccountsTable.id, id), eq(socialAccountsTable.userId, req.user!.userId)))
      .returning();
    if (!row) { res.status(404).json({ error: "Not Found" }); return; }
    res.json({ account: row });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 4. DELETE /social/:id - Disconnect account
router.delete("/social/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params as { id: string };
    await db
      .delete(socialAccountsTable)
      .where(and(eq(socialAccountsTable.id, id), eq(socialAccountsTable.userId, req.user!.userId)));
    res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 5. POST /social/publish - AI Multi-channel Auto-Dispatch & Unified Publishing Endpoint
router.post("/social/publish", async (req: AuthRequest, res) => {
  try {
    const userId = await resolveUserId(req);
    const {
      title,
      description,
      videoUrl,
      imageUrl,
      tags = [],
      platforms = [],
      privacyStatus = "public",
      aiOptimize = true,
      useGateway = false,
    } = req.body as {
      title: string;
      description: string;
      videoUrl?: string;
      imageUrl?: string;
      tags?: string[];
      platforms?: string[]; // e.g. ["facebook", "instagram", "youtube", "tiktok", "x", "linkedin"] or ["all"]
      privacyStatus?: "public" | "unlisted" | "private";
      aiOptimize?: boolean;
      useGateway?: boolean;
    };

    if (!title && !description) {
      res.status(400).json({ error: "Title and description are required for social publishing." });
      return;
    }

    // Fetch user's connected social accounts from DB
    const userAccounts = await db
      .select()
      .from(socialAccountsTable)
      .where(and(eq(socialAccountsTable.userId, userId), eq(socialAccountsTable.status, "connected")));

    if (userAccounts.length === 0) {
      res.status(400).json({
        error: "No connected social accounts found.",
        message: "Please connect your accounts via 1-Click OAuth on the Social Hub page.",
      });
      return;
    }

    // Determine target platforms
    const targets: AccountTarget[] = [];
    for (const acc of userAccounts) {
      const platformName = acc.platform.toLowerCase() as SocialPlatform;
      if (platforms.includes("all") || platforms.length === 0 || platforms.includes(platformName)) {
        targets.push({
          platform: platformName,
          credentials: {
            accessToken: acc.accessToken || undefined,
            refreshToken: acc.refreshToken || undefined,
            accountId: acc.username || undefined,
          },
          useGateway: useGateway || acc.platform === "universal_gateway",
        });
      }
    }

    if (targets.length === 0) {
      res.status(400).json({
        error: `None of the requested platforms (${platforms.join(", ")}) are connected.`,
        availableConnected: userAccounts.map((a) => a.platform),
      });
      return;
    }

    req.log?.info({ userId, targetsCount: targets.length, aiOptimize }, "Executing multi-channel AI social dispatch");

    // If the account was auto-seeded (mocked), simulate a successful publish to avoid API errors
    // Otherwise, use the real socialEngine to publish.
    const results: any[] = [];
    let successCount = 0;
    let failureCount = 0;

    for (const t of targets) {
      if (t.credentials.accessToken === "auto_connected" || t.credentials.accessToken === "mock_api") {
        failureCount++;
        results.push({
          platform: t.platform,
          status: "failed",
          error: "Social publishing requires real OAuth credentials, not auto-connected mock values. Please connect your accounts properly.",
        });
      } else {
        const res = await socialEngine.publish(
          { title, description, videoUrl, imageUrl, tags, privacyStatus, aiOptimize },
          t.platform,
          t.credentials,
          t.useGateway
        );
        results.push(res);
        if (res.status === "completed") successCount++;
        else failureCount++;
      }
    }

    const multiResult = {
      totalTargeted: targets.length,
      successCount,
      failureCount,
      results,
      dispatchedAt: new Date().toISOString(),
    };

    res.json({
      success: multiResult.successCount > 0,
      summary: `${multiResult.successCount} succeeded, ${multiResult.failureCount} failed out of ${multiResult.totalTargeted} platforms.`,
      result: multiResult,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    req.log?.error({ err }, "Error in POST /social/publish");
    res.status(500).json({ error: "Internal Server Error during multi-channel publishing", details: msg });
  }
});

// ── AUTO-CONNECT: Reads credentials from Railway env vars and links all platforms automatically ──
router.post("/social/auto-connect", requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;

    // Map of platform -> env var credentials
    const platformCreds: { platform: string; displayName: string; apiKey: string; apiSecret: string }[] = [
      { platform: "youtube",   displayName: "YouTube",   apiKey: process.env.YOUTUBE_CLIENT_ID   || "", apiSecret: process.env.YOUTUBE_CLIENT_SECRET   || "" },
      { platform: "tiktok",    displayName: "TikTok",    apiKey: process.env.TIKTOK_CLIENT_KEY   || "", apiSecret: process.env.TIKTOK_CLIENT_SECRET    || "" },
      { platform: "facebook",  displayName: "Facebook",  apiKey: process.env.FACEBOOK_APP_ID     || "", apiSecret: process.env.FACEBOOK_APP_SECRET     || "" },
      { platform: "instagram", displayName: "Instagram", apiKey: process.env.FACEBOOK_APP_ID     || "", apiSecret: process.env.FACEBOOK_APP_SECRET     || "" },
    ];

    const results: any[] = [];

    for (const cred of platformCreds) {
      if (!cred.apiKey) continue; // skip if no env var set

      // Check if already exists
      const [existing] = await db
        .select()
        .from(socialAccountsTable)
        .where(and(eq(socialAccountsTable.platform, cred.platform), eq(socialAccountsTable.userId, userId)))
        .limit(1);

      if (existing) {
        // Update to connected status
        const [updated] = await db
          .update(socialAccountsTable)
          .set({ apiKey: cred.apiKey, apiSecret: cred.apiSecret, status: "connected", displayName: cred.displayName, updatedAt: new Date() })
          .where(eq(socialAccountsTable.id, existing.id))
          .returning();
        results.push(updated);
      } else {
        // Insert new
        const [created] = await db
          .insert(socialAccountsTable)
          .values({
            userId,
            platform: cred.platform,
            displayName: cred.displayName,
            username: cred.displayName,
            apiKey: cred.apiKey,
            apiSecret: cred.apiSecret,
            status: "connected",
            accessToken: `auto_${Date.now()}`,
          } as typeof socialAccountsTable.$inferInsert)
          .returning();
        results.push(created);
      }
    }

    // Also auto-connect ElevenLabs and HeyGen as special AI provider accounts
    const aiProviders = [
      { platform: "elevenlabs", displayName: "ElevenLabs AI", apiKey: process.env.ELEVENLABS_API_KEY || "" },
      { platform: "heygen",     displayName: "HeyGen AI",     apiKey: process.env.HEYGEN_API_KEY     || "" },
    ];

    for (const ai of aiProviders) {
      if (!ai.apiKey) continue;
      const [existing] = await db
        .select()
        .from(socialAccountsTable)
        .where(and(eq(socialAccountsTable.platform, ai.platform), eq(socialAccountsTable.userId, userId)))
        .limit(1);

      if (existing) {
        const [updated] = await db
          .update(socialAccountsTable)
          .set({ apiKey: ai.apiKey, status: "connected", displayName: ai.displayName, updatedAt: new Date() })
          .where(eq(socialAccountsTable.id, existing.id))
          .returning();
        results.push(updated);
      } else {
        const [created] = await db
          .insert(socialAccountsTable)
          .values({
            userId,
            platform: ai.platform,
            displayName: ai.displayName,
            username: ai.displayName,
            apiKey: ai.apiKey,
            apiSecret: "",
            status: "connected",
            accessToken: `auto_${Date.now()}`,
          } as typeof socialAccountsTable.$inferInsert)
          .returning();
        results.push(created);
      }
    }

    res.json({
      success: true,
      message: `✅ تم ربط ${results.length} منصة تلقائياً`,
      connectedCount: results.length,
      accounts: results,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error during auto-connect" });
  }
});

export default router;
