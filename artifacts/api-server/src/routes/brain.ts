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

export default router;
