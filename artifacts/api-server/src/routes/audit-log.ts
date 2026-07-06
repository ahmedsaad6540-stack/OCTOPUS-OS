import { Router, type IRouter } from "express";
import { auditLogger } from "../lib/audit-observability.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";

const router: IRouter = Router();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Read-only view over the cross-cutting audit trail, populated
 * automatically by `middleware/audit.ts` for every successful mutating
 * request — no route file writes to it directly. Admin-only: an audit
 * trail that any user could read would defeat much of its point.
 */
router.get("/audit-log", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (req.user!.role !== "admin") {
      res.status(403).json({ error: "Forbidden", message: "Only admins can view the audit log" });
      return;
    }
    const { action, resourceType, resourceId, actorUserId, limit } = req.query;
    const parsedLimit = typeof limit === "string" ? Number(limit) : undefined;
    const entries = await auditLogger.list({
      action: typeof action === "string" ? action : undefined,
      resourceType: typeof resourceType === "string" ? resourceType : undefined,
      resourceId: typeof resourceId === "string" ? resourceId : undefined,
      actorUserId: typeof actorUserId === "string" ? actorUserId : undefined,
      limit: Number.isFinite(parsedLimit) ? parsedLimit : undefined,
    });
    res.json({ entries });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/audit-log/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (req.user!.role !== "admin") {
      res.status(403).json({ error: "Forbidden", message: "Only admins can view the audit log" });
      return;
    }
    const { id } = req.params as { id: string };
    if (!UUID_RE.test(id)) {
      res.status(400).json({ error: "Bad Request", message: "id must be a UUID" });
      return;
    }
    const entry = await auditLogger.get(id);
    if (!entry) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    res.json({ entry });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
