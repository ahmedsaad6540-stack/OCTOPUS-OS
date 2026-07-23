import { Router, type IRouter } from "express";
import { settingsManager } from "../lib/settings-manager.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";

const router: IRouter = Router();

function validateValueBody(body: unknown): { error: string } | { value: unknown } {
  if (body === null || typeof body !== "object" || !("value" in body)) {
    return { error: "body must be an object with a value field" };
  }
  return { value: (body as Record<string, unknown>)["value"] };
}

/**
 * System-scoped settings: readable by any authenticated user (e.g. feature
 * flags a client needs to check), writable by admins only.
 */
router.get("/settings/system", requireAuth, async (req: AuthRequest, res) => {
  try {
    const settings = await settingsManager.list("system");
    res.json({ settings });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/settings/system/:key", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { key } = req.params as { key: string };
    const setting = await settingsManager.get("system", key);
    if (!setting) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    res.json({ setting });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/settings/system/:key", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (req.user!.role !== "admin") {
      res.status(403).json({ error: "Forbidden", message: "Only admins can set system settings" });
      return;
    }
    const { key } = req.params as { key: string };
    const validated = validateValueBody(req.body);
    if ("error" in validated) {
      res.status(400).json({ error: "Bad Request", message: validated.error });
      return;
    }
    const setting = await settingsManager.set("system", key, validated.value);
    res.json({ setting });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/settings/system/:key", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (req.user!.role !== "admin") {
      res.status(403).json({ error: "Forbidden", message: "Only admins can delete system settings" });
      return;
    }
    const { key } = req.params as { key: string };
    const deleted = await settingsManager.delete("system", key);
    if (!deleted) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/** Per-user settings: every authenticated user reads/writes only their own. */
router.get("/settings/me", requireAuth, async (req: AuthRequest, res) => {
  try {
    const settings = await settingsManager.list("user", req.user!.userId);
    res.json({ settings });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/settings/me/:key", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { key } = req.params as { key: string };
    const setting = await settingsManager.get("user", key, req.user!.userId);
    if (!setting) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    res.json({ setting });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/settings/me/:key", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { key } = req.params as { key: string };
    const validated = validateValueBody(req.body);
    if ("error" in validated) {
      res.status(400).json({ error: "Bad Request", message: validated.error });
      return;
    }
    const setting = await settingsManager.set("user", key, validated.value, req.user!.userId);
    res.json({ setting });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/settings/me/:key", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { key } = req.params as { key: string };
    const deleted = await settingsManager.delete("user", key, req.user!.userId);
    if (!deleted) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
