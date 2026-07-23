import { Router, type IRouter } from "express";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";
import { settingsManager } from "../lib/settings-manager.js";
import { randomUUID } from "node:crypto";

const router: IRouter = Router();

/**
 * GET /api/security
 * Returns API keys and active sessions for the current user.
 */
router.get("/security", requireAuth, async (req: AuthRequest, res) => {
  try {
    const apiKeysSetting = await settingsManager.get("user", "api_keys", req.user!.userId);
    const sessionsSetting = await settingsManager.get("user", "sessions", req.user!.userId);

    const apiKeys = apiKeysSetting?.value || [];
    const sessions = sessionsSetting?.value || [
      {
        device: req.headers["user-agent"] || "Unknown Device",
        browser: "Current Session",
        ip: req.ip || "127.0.0.1",
        location: "Unknown",
        active: true,
        time: new Date().toISOString(),
      }
    ];

    res.json({ apiKeys, sessions });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * POST /api/security/api-keys
 * Generates a new API key.
 */
router.post("/security/api-keys", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { name } = req.body;
    const newKey = {
      id: randomUUID(),
      name: name || "New API Key",
      key: `oct_live_${randomUUID().replace(/-/g, "")}`,
      created: new Date().toISOString(),
      lastUsed: "Never",
    };

    const apiKeysSetting = await settingsManager.get("user", "api_keys", req.user!.userId);
    const apiKeys = (apiKeysSetting?.value as any[]) || [];
    apiKeys.push(newKey);
    await settingsManager.set("user", "api_keys", apiKeys, req.user!.userId);

    res.json({ apiKey: newKey });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * DELETE /api/security/api-keys/:id
 * Revokes an API key.
 */
router.delete("/security/api-keys/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const apiKeysSetting = await settingsManager.get("user", "api_keys", req.user!.userId);
    let apiKeys = (apiKeysSetting?.value as any[]) || [];
    apiKeys = apiKeys.filter(k => k.id !== id);
    await settingsManager.set("user", "api_keys", apiKeys, req.user!.userId);
    res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
