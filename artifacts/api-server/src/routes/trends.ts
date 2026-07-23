import { Router } from "express";
import { db } from "@workspace/db";
import { ViralDetector, DrizzleViralDetectorStore } from "@workspace/viral-detector";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";
import { logger } from "../lib/logger.js";

const router = Router();
const store = new DrizzleViralDetectorStore(db);
const detector = new ViralDetector(store);

/**
 * GET /api/trends
 * List all scanned trend signals from PostgreSQL
 */
router.get("/trends", requireAuth, async (req: AuthRequest, res) => {
  try {
    const signals = await store.listSignals();
    res.json({ signals });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error({ err: msg }, "Failed to fetch trend signals");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * POST /api/trends/scan
 * Triggers a real trend scan across platforms (TikTok, YouTube, Amazon, Google Trends)
 * and saves new viral signals in PostgreSQL.
 */
router.post("/trends/scan", requireAuth, async (req: AuthRequest, res) => {
  try {
    const platforms = req.body.platforms || ["tiktok", "youtube", "google_trends"];
    console.log(`[TREND SCAN] Scanning trends for platforms: ${platforms.join(", ")}`);
    const newSignals = await detector.scanTrends(platforms);
    res.json({ success: true, count: newSignals.length, signals: newSignals });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error({ err: msg }, "Trend scanning execution failed");
    res.status(500).json({ error: "Trend scan failed", detail: msg });
  }
});

export default router;
