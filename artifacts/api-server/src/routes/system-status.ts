import { Router, type IRouter } from "express";
import { observabilityService } from "../lib/audit-observability.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";

const router: IRouter = Router();

/**
 * A system-wide health snapshot aggregated from every OS Core module's own
 * read methods (see `lib/audit-observability.ts` for the registered
 * probes). Admin-only, since it exposes internal operational counts across
 * every user's data, not just the caller's own.
 */
router.get("/system/status", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (req.user!.role !== "admin") {
      res.status(403).json({ error: "Forbidden", message: "Only admins can view system status" });
      return;
    }
    const status = await observabilityService.getStatus();
    res.json({ status });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
