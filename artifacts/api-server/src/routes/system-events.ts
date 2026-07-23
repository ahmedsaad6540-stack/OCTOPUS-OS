import { Router, type IRouter } from "express";
import { eventBus } from "../lib/event-bus.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";

const router: IRouter = Router();

/**
 * Read-only view over the Event Bus's durable event history. This is the
 * one place any client (web, mobile, desktop, or a future AI client) can
 * observe what is happening inside OS Core — it never needs, and is never
 * given, direct access to individual modules or agents.
 */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

router.get("/system/events", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { type, correlationId, before, limit } = req.query;

    if (typeof correlationId === "string" && !UUID_RE.test(correlationId)) {
      res.status(400).json({ error: "Bad Request", message: "correlationId must be a UUID" });
      return;
    }
    if (typeof before === "string" && Number.isNaN(Date.parse(before))) {
      res.status(400).json({ error: "Bad Request", message: "before must be a valid ISO date" });
      return;
    }

    const isAdmin = req.user!.role === "admin";
    const parsedLimit = typeof limit === "string" ? Number(limit) : undefined;
    const events = await eventBus.history({
      type: typeof type === "string" ? type : undefined,
      correlationId: typeof correlationId === "string" ? correlationId : undefined,
      before: typeof before === "string" ? before : undefined,
      limit: Number.isFinite(parsedLimit) ? parsedLimit : undefined,
      // Non-admins only ever see events scoped to their own account; system-
      // wide events (no userId) and other users' events are admin-only.
      ...(isAdmin ? {} : { userId: req.user!.userId }),
    });
    res.json({ events });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/system/events/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params as { id: string };
    if (!UUID_RE.test(id)) {
      res.status(400).json({ error: "Bad Request", message: "id must be a UUID" });
      return;
    }
    const event = await eventBus.getEvent(id);
    if (!event) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    res.json({ event });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
