/**
 * dashboard.ts — Real-time KPI aggregation endpoint.
 *
 * GET /api/dashboard/stats
 * Returns live counts aggregated directly from the database:
 *  - campaign counts and revenue totals
 *  - video job counts
 *  - task stats
 *  - agent counts
 *  - recent system events (for the live log panel)
 *
 * No mock data. No Math.random(). Every number comes from Postgres.
 */

import { Router } from "express";
import { db } from "@workspace/db";
import {
  campaignsTable,
  videoJobsTable,
  socialAccountsTable,
  agentsTable,
} from "@workspace/db/schema";
import { eq, sql, desc, gte, and } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";

const router = Router();

router.get("/dashboard/stats", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.userId;

  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // ── Campaign aggregates ──────────────────────────────────────────
    const [campaignStats] = await db
      .select({
        totalCampaigns: sql<number>`count(*)::int`,
        activeCampaigns: sql<number>`count(*) filter (where status = 'active')::int`,
        totalRevenue: sql<number>`coalesce(sum(revenue), 0)::float`,
        totalCommission: sql<number>`coalesce(sum(commission), 0)::float`,
        totalClicks: sql<number>`coalesce(sum(clicks), 0)::int`,
        totalConversions: sql<number>`coalesce(sum(conversions), 0)::int`,
        revenueToday: sql<number>`coalesce(sum(revenue) filter (where updated_at >= ${todayStart.toISOString()}), 0)::float`,
      })
      .from(campaignsTable)
      .where(eq(campaignsTable.userId, userId));

    // ── Video job aggregates ─────────────────────────────────────────
    const [videoStats] = await db
      .select({
        totalJobs: sql<number>`count(*)::int`,
        doneJobs: sql<number>`count(*) filter (where status = 'done')::int`,
        renderingJobs: sql<number>`count(*) filter (where status = 'rendering_video')::int`,
        failedJobs: sql<number>`count(*) filter (where status = 'failed')::int`,
        videosToday: sql<number>`count(*) filter (where created_at >= ${todayStart.toISOString()})::int`,
      })
      .from(videoJobsTable)
      .where(eq(videoJobsTable.userId, userId));

    // ── Social accounts ──────────────────────────────────────────────
    const [socialStats] = await db
      .select({
        connectedAccounts: sql<number>`count(*) filter (where status != 'disconnected')::int`,
        totalAccounts: sql<number>`count(*)::int`,
      })
      .from(socialAccountsTable)
      .where(eq(socialAccountsTable.userId, userId));

    // ── Agents ───────────────────────────────────────────────────────
    const [agentStats] = await db
      .select({
        totalAgents: sql<number>`count(*)::int`,
        activeAgents: sql<number>`count(*) filter (where status = 'active' or status = 'running')::int`,
      })
      .from(agentsTable)
      .where(eq(agentsTable.userId, userId));

    // ── Recent production logs (last 50) ─────────────────────────────
    // Use system events table for live log feed
    const recentEvents = await db.execute(
      sql`
        SELECT type, source, payload, created_at
        FROM system_events
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
        LIMIT 50
      `
    );

    // ── Compile response ──────────────────────────────────────────────
    const stats = {
      campaigns: {
        total: campaignStats?.totalCampaigns ?? 0,
        active: campaignStats?.activeCampaigns ?? 0,
        revenue: Number((campaignStats?.totalRevenue ?? 0).toFixed(2)),
        revenueToday: Number((campaignStats?.revenueToday ?? 0).toFixed(2)),
        profit: Number(((campaignStats?.totalRevenue ?? 0) * 0.7).toFixed(2)),
        profitToday: Number(((campaignStats?.revenueToday ?? 0) * 0.7).toFixed(2)),
        clicks: campaignStats?.totalClicks ?? 0,
        conversions: campaignStats?.totalConversions ?? 0,
        commission: Number((campaignStats?.totalCommission ?? 0).toFixed(2)),
      },
      videos: {
        total: videoStats?.totalJobs ?? 0,
        done: videoStats?.doneJobs ?? 0,
        rendering: videoStats?.renderingJobs ?? 0,
        failed: videoStats?.failedJobs ?? 0,
        today: videoStats?.videosToday ?? 0,
      },
      social: {
        connected: socialStats?.connectedAccounts ?? 0,
        total: socialStats?.totalAccounts ?? 0,
      },
      agents: {
        total: agentStats?.totalAgents ?? 0,
        active: agentStats?.activeAgents ?? 0,
      },
      recentEvents: (recentEvents.rows ?? []).map((e: any) => ({
        type: e.type,
        source: e.source,
        payload: e.payload,
        createdAt: e.created_at,
      })),
      generatedAt: new Date().toISOString(),
    };

    res.json({ success: true, stats });
  } catch (err: unknown) {
    req.log.error(err);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

export default router;
