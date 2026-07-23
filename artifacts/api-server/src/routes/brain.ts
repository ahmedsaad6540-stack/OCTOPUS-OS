import { Router, type IRouter } from "express";
import { decisionOutcomeValues } from "@workspace/brain";
import { brain } from "../lib/brain.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";

const router: IRouter = Router();

/**
 * Read-only view over the Brain's decision trail. There is no write path
 * here on purpose — the Brain only ever decides in reaction to an event on
 * the Event Bus (see `../lib/brain-rules.ts`), never because a client asked
 * it to. This is OS Core's "why did this happen" endpoint, the decision
 * counterpart to `GET /api/system/events`.
 */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

router.get("/brain/decisions", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { ruleName, eventType, outcome, correlationId, limit } = req.query;

    if (typeof correlationId === "string" && !UUID_RE.test(correlationId)) {
      res.status(400).json({ error: "Bad Request", message: "correlationId must be a UUID" });
      return;
    }
    if (
      typeof outcome === "string" &&
      !decisionOutcomeValues.includes(outcome as (typeof decisionOutcomeValues)[number])
    ) {
      res.status(400).json({
        error: "Bad Request",
        message: `outcome must be one of: ${decisionOutcomeValues.join(", ")}`,
      });
      return;
    }

    const isAdmin = req.user!.role === "admin";
    const parsedLimit = typeof limit === "string" ? Number(limit) : undefined;
    const decisions = await brain.listDecisions({
      ruleName: typeof ruleName === "string" ? ruleName : undefined,
      eventType: typeof eventType === "string" ? eventType : undefined,
      outcome: typeof outcome === "string" ? (outcome as (typeof decisionOutcomeValues)[number]) : undefined,
      correlationId: typeof correlationId === "string" ? correlationId : undefined,
      limit: Number.isFinite(parsedLimit) ? parsedLimit : undefined,
      // Non-admins only ever see decisions scoped to their own account;
      // system-wide decisions (no userId) and other users' decisions are
      // admin-only.
      ...(isAdmin ? {} : { userId: req.user!.userId }),
    });
    res.json({ decisions });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/brain/decisions/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params as { id: string };
    if (!UUID_RE.test(id)) {
      res.status(400).json({ error: "Bad Request", message: "id must be a UUID" });
      return;
    }
    const decision = await brain.getDecision(id);
    if (!decision) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    const isAdmin = req.user!.role === "admin";
    if (!isAdmin && decision.userId && decision.userId !== req.user!.userId) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    res.json({ decision });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

import { db } from "@workspace/db";
import { promptsTable } from "@workspace/db/schema";
import { eq, and, desc } from "drizzle-orm";

// CRUD endpoints for Prompt Studio stored in PostgreSQL
const DEFAULT_PROMPTS_DATA = [
  {
    name: "Product Research Master", agent: "Brain", category: "Research",
    content: `You are OCTOPUS Brain — the master research agent. Your job is to find winning affiliate products.\n\nAnalyze the following criteria:\n1. Market demand (Google Trends, TikTok search volume)\n2. Competition level (low = better for beginners)\n3. Commission rate (aim for 30%+ or $20+ per sale)\n4. Product reviews (4+ stars, 100+ reviews)\n5. Affiliate program reliability\n\nOutput a JSON with: productName, category, estimatedRevenue, difficulty, recommendation.`,
    uses: 147, rating: 4.8
  },
  {
    name: "Viral Hook Generator", agent: "Creator", category: "Content",
    content: `You are OCTOPUS Creator. Generate 10 viral hooks for this product: {{product_name}}.\n\nRules:\n- Hook must be under 5 seconds when read aloud\n- Start with a controversial statement, question, or shocking fact\n- Appeal to {{target_audience}} pain points\n- End with curiosity gap to keep watching\n\nFormat: numbered list, one hook per line, no explanations.`,
    uses: 89, rating: 4.9
  },
  {
    name: "Daily Briefing Generator", agent: "CEO", category: "Strategy",
    content: `You are the OCTOPUS AI CEO. Generate today's strategic briefing.\n\nAvailable data:\n- Revenue: {{revenue_today}}\n- Active campaigns: {{campaign_count}}\n- Top performing: {{top_campaign}}\n- Alerts: {{alerts}}\n\nGenerate a concise morning briefing with:\n1. Yesterday's performance summary\n2. Today's top 3 priorities\n3. One specific recommendation with reasoning\n4. Any risks to watch\n\nTone: decisive, data-driven, under 200 words.`,
    uses: 52, rating: 4.7
  },
  {
    name: "Trend Detection Scan", agent: "TrendHunter", category: "Research",
    content: `You are OCTOPUS TrendHunter. Scan for emerging affiliate opportunities.\n\nCurrent date: {{current_date}}\nPlatform: {{platform}}\n\nLook for:\n1. Products trending in last 48 hours\n2. Hashtags with rapid growth (>50% weekly)\n3. Creator content that's going viral with products\n4. Search volume spikes on Google/YouTube\n\nOutput: JSON array of trends with {trend, platform, growthRate, opportunityScore (1-10), suggestedProduct}`,
    uses: 203, rating: 4.6
  }
];

router.get("/brain/prompts", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  try {
    let prompts = await db
      .select()
      .from(promptsTable)
      .where(eq(promptsTable.userId, userId))
      .orderBy(desc(promptsTable.updatedAt));

    if (prompts.length === 0) {
      // Seed default prompts for this user in DB
      const inserted = [];
      for (const p of DEFAULT_PROMPTS_DATA) {
        const [resP] = await db.insert(promptsTable).values({
          userId,
          name: p.name,
          agent: p.agent,
          category: p.category,
          content: p.content,
          uses: p.uses,
          rating: p.rating
        }).returning();
        if (resP) inserted.push(resP);
      }
      prompts = inserted;
    }

    res.json({ success: true, prompts });
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ success: false, error: err.message || "Internal Server Error" });
  }
});

router.post("/brain/prompts", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  const { name, agent = "Brain", category = "Research", content } = req.body;
  if (!name || !content) {
    res.status(400).json({ success: false, error: "Name and content are required" });
    return;
  }
  try {
    const [prompt] = await db.insert(promptsTable).values({
      userId,
      name,
      agent,
      category,
      content,
      uses: 0,
      rating: 5.0
    }).returning();
    res.status(201).json({ success: true, prompt });
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ success: false, error: err.message || "Internal Server Error" });
  }
});

router.put("/brain/prompts/:id", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  const { id } = req.params as { id: string };
  const { name, agent, category, content } = req.body;
  try {
    const [updated] = await db.update(promptsTable).set({
      ...(name ? { name } : {}),
      ...(agent ? { agent } : {}),
      ...(category ? { category } : {}),
      ...(content !== undefined ? { content } : {}),
      updatedAt: new Date()
    }).where(and(eq(promptsTable.id, id), eq(promptsTable.userId, userId))).returning();

    if (!updated) {
      res.status(404).json({ success: false, error: "Prompt not found" });
      return;
    }
    res.json({ success: true, prompt: updated });
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ success: false, error: err.message || "Internal Server Error" });
  }
});

router.delete("/brain/prompts/:id", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  const { id } = req.params as { id: string };
  try {
    await db.delete(promptsTable).where(and(eq(promptsTable.id, id), eq(promptsTable.userId, userId)));
    res.json({ success: true });
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ success: false, error: err.message || "Internal Server Error" });
  }
});

export default router;
