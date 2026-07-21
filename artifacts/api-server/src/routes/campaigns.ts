import { Router } from "express";
import { db } from "@workspace/db";
import { campaignsTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";

const router = Router();

router.get("/campaigns", requireAuth, async (req: AuthRequest, res) => {
  try {
    const rows = await db
      .select()
      .from(campaignsTable)
      .where(eq(campaignsTable.userId, req.user!.userId))
      .orderBy(campaignsTable.createdAt);
    res.json({ campaigns: rows });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/campaigns", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id: _id, userId: _uid, createdAt: _ca, updatedAt: _ua, ...cleanBody } = req.body as Record<string, any>;
    
    // Ensure productName is provided to satisfy NOT NULL constraint
    if (!cleanBody.productName) {
      cleanBody.productName = cleanBody.name || "Auto-Selected Product";
    }

    const [row] = await db
      .insert(campaignsTable)
      .values({ ...cleanBody, userId: req.user!.userId } as typeof campaignsTable.$inferInsert)
      .returning();
    res.status(201).json({ campaign: row });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Internal Server Error" });
  }
});

router.put("/campaigns/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params as { id: string };
    const { id: _id, userId: _uid, createdAt: _ca, updatedAt: _ua, ...cleanBody } = req.body as Record<string, any>;
    const [row] = await db
      .update(campaignsTable)
      .set({ ...cleanBody, updatedAt: new Date() })
      .where(and(eq(campaignsTable.id, id), eq(campaignsTable.userId, req.user!.userId)))
      .returning();
    if (!row) { res.status(404).json({ error: "Not Found" }); return; }
    res.json({ campaign: row });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Internal Server Error" });
  }
});

router.delete("/campaigns/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params as { id: string };
    await db
      .delete(campaignsTable)
      .where(and(eq(campaignsTable.id, id), eq(campaignsTable.userId, req.user!.userId)));
    res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/campaigns/:id/publish", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params as { id: string };
    const { publishedUrl } = req.body as { publishedUrl: string };
    
    if (!publishedUrl) {
      res.status(400).json({ error: "publishedUrl is required" });
      return;
    }

    // Update campaign separate from publishing job
    const [row] = await db
      .update(campaignsTable)
      .set({ 
        publishedUrl, 
        status: "active",
        updatedAt: new Date() 
      })
      .where(and(eq(campaignsTable.id, id), eq(campaignsTable.userId, req.user!.userId)))
      .returning();

    if (!row) { res.status(404).json({ error: "Campaign not found" }); return; }

    // Update the publishing job state if it exists
    const { videoJobsTable } = await import("@workspace/db");
    await db
      .update(videoJobsTable)
      .set({
        status: "user_confirmed",
        publishedUrl,
        updatedAt: new Date()
      })
      .where(eq(videoJobsTable.campaignId, id));

    res.json({ success: true, campaign: row });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/campaigns/:id/stats", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params as { id: string };
    
    // Check if campaign exists
    const [campaign] = await db
      .select()
      .from(campaignsTable)
      .where(and(eq(campaignsTable.id, id), eq(campaignsTable.userId, req.user!.userId)))
      .limit(1);

    if (!campaign) {
      res.status(404).json({ error: "Campaign not found" });
      return;
    }

    // Default real values from DB if available, else 0
    const clicks = campaign.clicks || 0;
    const conversions = campaign.conversions || 0;
    const revenue = Number(campaign.revenue || 0);
    const commission = Number(campaign.commission || 0);
    
    // Profit = commission or revenue * margin, simplify to commission for now
    const profit = commission > 0 ? commission : revenue * 0.7;
    const cost = revenue > 0 ? revenue * 0.3 : 0; 
    const roi = cost > 0 ? Math.round((profit / cost) * 100) : 0;
    
    const cr = clicks > 0 ? ((conversions / clicks) * 100).toFixed(1) : "0.0";
    const epc = clicks > 0 ? (revenue / clicks).toFixed(2) : "0.00";

    // Build timeline based on status
    const progressMap: Record<string, number> = {
      "draft": 0,
      "active": 20,
      "running": 50,
      "completed": 100,
      "paused": 50,
      "failed": 0
    };
    const progress = progressMap[campaign.status || "draft"] || 0;

    const timeline = [
      { label: "Campaign Created", done: true, time: new Date(campaign.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }) },
      { label: "AI Script Generated", done: progress >= 20, time: "--:--" },
      { label: "Video Rendering", done: progress >= 50, time: "--:--" },
      { label: "Published to Social", done: !!campaign.publishedUrl, time: "--:--" },
    ];

    res.json({
      clicks,
      sales: conversions,
      revenue,
      profit,
      roi,
      videos: campaign.videoId ? 1 : 0,
      posts: campaign.publishedUrl ? 1 : 0,
      views: campaign.impressions || 0,
      cr,
      epc,
      progress,
      timeline
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
