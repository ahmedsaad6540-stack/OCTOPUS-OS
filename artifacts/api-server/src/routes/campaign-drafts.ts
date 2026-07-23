import { Router } from "express";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";
import { db } from "@workspace/db";
import { affiliateCampaignDraftsTable } from "@workspace/db/schema";
import { eq, and, lt } from "drizzle-orm";

const router = Router();

// Cleanup stale drafts periodically (could also be a cron job)
setInterval(async () => {
  try {
    await db.delete(affiliateCampaignDraftsTable).where(
      lt(affiliateCampaignDraftsTable.expiresAt, new Date())
    );
  } catch (err) {
    console.error("Failed to cleanup expired campaign drafts", err);
  }
}, 1000 * 60 * 60);

router.post("/campaign-drafts/from-affiliate-product", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { affiliateProductId, trackingLinkId, provider, productName, trackingUrl } = req.body;
    
    if (!affiliateProductId || !trackingLinkId || !provider || !productName || !trackingUrl) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const userId = req.user!.userId;
    const workspaceId = userId; // In this setup, workspaceId maps to userId for simplicity
    
    // Drafts expire in 24 hours
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);

    const [draftRow] = await db.insert(affiliateCampaignDraftsTable)
      .values({
        workspaceId,
        userId,
        affiliateProductId,
        trackingLinkId,
        provider,
        draftPayload: { productName, trackingUrl },
        expiresAt
      }).returning();

    res.status(201).json({ campaignDraftId: draftRow.id });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to create draft" });
  }
});

router.get("/campaign-drafts/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const draftId = req.params.id as string;
    
    const [draft] = await db.select()
      .from(affiliateCampaignDraftsTable)
      .where(eq(affiliateCampaignDraftsTable.id, draftId));

    if (!draft || draft.expiresAt < new Date()) {
      res.status(404).json({ error: "Draft not found or expired" });
      return;
    }

    // Strict workspace isolation check
    if (draft.userId !== req.user!.userId) {
      res.status(403).json({ error: "Forbidden: Draft belongs to another workspace" });
      return;
    }
    
    if (draft.status !== "active") {
      res.status(400).json({ error: `Draft cannot be accessed. Status: ${draft.status}` });
      return;
    }

    const payload = draft.draftPayload as { productName: string; trackingUrl: string };

    res.json({
      productName: payload.productName,
      productUrl: payload.trackingUrl
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch draft" });
  }
});

export default router;
