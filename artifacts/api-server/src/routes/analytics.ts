/**
 * analytics.ts — Real analytics data aggregation.
 *
 * GET /api/analytics/summary?period=7d
 * Returns aggregated metrics from real DB tables.
 * Periods: 1d, 7d, 30d, 90d
 */

import { Router } from "express";
import { db } from "@workspace/db";
import { campaignsTable, videoJobsTable } from "@workspace/db/schema";
import { eq, sql, gte, and } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";

const router = Router();

function getPeriodStart(period: string): Date {
  const now = new Date();
  switch (period) {
    case "1d": return new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
    case "30d": return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case "90d": return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    default: return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7d
  }
}

router.get("/analytics/summary", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  const period = (req.query["period"] as string) || "7d";
  const since = getPeriodStart(period);

  try {
    // Campaign-level aggregates
    const [totals] = await db
      .select({
        totalRevenue: sql<number>`coalesce(sum(revenue), 0)::float`,
        totalClicks: sql<number>`coalesce(sum(clicks), 0)::int`,
        totalConversions: sql<number>`coalesce(sum(conversions), 0)::int`,
        totalSpent: sql<number>`coalesce(sum(spent), 0)::float`,
        activeCampaigns: sql<number>`count(*) filter (where status = 'active')::int`,
        totalCampaigns: sql<number>`count(*)::int`,
      })
      .from(campaignsTable)
      .where(and(
        eq(campaignsTable.userId, userId),
        gte(campaignsTable.updatedAt, since),
      ));

    // Per-day revenue breakdown (last N days)
    const dailyRevenue = await db.execute(sql`
      SELECT
        date_trunc('day', updated_at) as day,
        coalesce(sum(revenue), 0) as revenue,
        coalesce(sum(clicks), 0) as clicks,
        coalesce(sum(conversions), 0) as conversions
      FROM campaigns
      WHERE user_id = ${userId}
        AND updated_at >= ${since.toISOString()}
      GROUP BY date_trunc('day', updated_at)
      ORDER BY day ASC
    `);

    // Video jobs breakdown
    const [videoTotals] = await db
      .select({
        total: sql<number>`count(*)::int`,
        done: sql<number>`count(*) filter (where status = 'done')::int`,
        failed: sql<number>`count(*) filter (where status = 'failed')::int`,
        rendering: sql<number>`count(*) filter (where status = 'rendering_video')::int`,
      })
      .from(videoJobsTable)
      .where(and(
        eq(videoJobsTable.userId, userId),
        gte(videoJobsTable.createdAt, since),
      ));

    const revenue = totals?.totalRevenue ?? 0;
    const spent = totals?.totalSpent ?? 0;
    const roi = spent > 0 ? (((revenue - spent) / spent) * 100) : 0;

    const days = dailyRevenue.rows as Array<{
      day: string; revenue: string; clicks: string; conversions: string;
    }>;

    res.json({
      success: true,
      period,
      summary: {
        revenue: Number(revenue.toFixed(2)),
        clicks: totals?.totalClicks ?? 0,
        conversions: totals?.totalConversions ?? 0,
        spent: Number(spent.toFixed(2)),
        roi: Number(roi.toFixed(1)),
        activeCampaigns: totals?.activeCampaigns ?? 0,
        totalCampaigns: totals?.totalCampaigns ?? 0,
        videos: {
          total: videoTotals?.total ?? 0,
          done: videoTotals?.done ?? 0,
          failed: videoTotals?.failed ?? 0,
          rendering: videoTotals?.rendering ?? 0,
        },
      },
      daily: days.map((d) => ({
        day: d.day,
        revenue: Number(parseFloat(d.revenue).toFixed(2)),
        clicks: Number(d.clicks),
        conversions: Number(d.conversions),
      })),
    });
  } catch (err: unknown) {
    req.log.error(err);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

export default router;
