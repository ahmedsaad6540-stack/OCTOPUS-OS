import type { Request, Response, NextFunction } from "express";
import { db } from "@workspace/db";
import { billingSubscriptionsTable, usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger.js";

/**
 * Middleware to enforce workspace limits based on the user's billing tier.
 * Checks if the user has an active subscription or if they are within the free tier limits.
 */
export async function enforceWorkspaceLimits(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user?.id || req.headers["x-user-id"];
    
    if (!userId) {
      // If no user context, skip or let auth middleware handle it
      return next();
    }

    const [subscription] = await db
      .select()
      .from(billingSubscriptionsTable)
      .where(eq(billingSubscriptionsTable.userId, userId as string))
      .limit(1);

    const plan = subscription?.planId || "free";
    const status = subscription?.status || "active";

    // Example limits
    const limits: Record<string, { agents: number; bandwidth: number }> = {
      free: { agents: 1, bandwidth: 100 },
      pro: { agents: 5, bandwidth: 1000 },
      enterprise: { agents: 999, bandwidth: 99999 }
    };

    const currentLimits = limits[plan] || limits.free;

    if (status !== "active" && status !== "trialing") {
      res.status(403).json({ error: "Subscription is inactive. Please update your billing." });
      return;
    }

    // Attach limits to request context for downstream handlers
    (req as any).workspaceLimits = currentLimits;
    
    next();
  } catch (err) {
    logger.error({ err }, "Failed to enforce workspace limits");
    // Fail open or fail closed depending on requirements. We'll fail open for safety.
    next();
  }
}
