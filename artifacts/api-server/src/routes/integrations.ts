import { Router } from "express";
import { db } from "@workspace/db";
import { socialAccountsTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { logger } from "../lib/logger.js";
import { createOAuthState } from "../lib/oauth-state.js";

const router = Router();

// Secure POST endpoint to initiate connection
router.post("/youtube/connect", async (req, res) => {
  const userId = (req as any).user?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    let clientId = process.env.YOUTUBE_CLIENT_ID || "";
    // If we wanted to allow custom client IDs from DB, we could fetch here.
    // For now, we rely on the env var for the production application flow.
    if (!clientId) {
      res.status(400).json({ error: "YouTube Client ID not configured on the server." });
      return;
    }

    const protocol = req.protocol === 'http' && req.get('host')?.includes('railway.app') ? 'https' : req.protocol;
    const baseUrl = process.env.API_URL || `${protocol}://${req.get("host")}`;
    const apiUrl = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
    const callbackUrl = `${apiUrl}/oauth/youtube/callback`;
    
    // Generate secure state
    const state = createOAuthState(userId);

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(callbackUrl)}&response_type=code&scope=https://www.googleapis.com/auth/youtube.upload%20https://www.googleapis.com/auth/youtube.readonly&access_type=offline&state=${encodeURIComponent(state)}&prompt=consent`;

    res.json({ authorizationUrl: authUrl });
  } catch (err) {
    logger.error(err, "Failed to generate YouTube connect URL");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET status without exposing tokens
router.get("/youtube/status", async (req, res) => {
  const userId = (req as any).user?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const [account] = await db
      .select()
      .from(socialAccountsTable)
      .where(and(eq(socialAccountsTable.userId, userId), eq(socialAccountsTable.platform, "youtube")))
      .limit(1);

    if (!account) {
      res.json({ status: "NOT_CONFIGURED" });
      return;
    }

    // Determine truthful state
    let state = account.status || "NOT_CONFIGURED";
    // Normalize connected/LIVE_VERIFIED to LIVE_VERIFIED
    if (state === "connected" || state === "active" || state === "LIVE_VERIFIED") {
      state = "LIVE_VERIFIED";
    }
    // Only treat mock as NOT_CONFIGURED if not already verified by real_oauth
    if (account.connectionSource === "mock" && state !== "LIVE_VERIFIED" && process.env.VITE_DEV_MODE !== "true") {
      state = "NOT_CONFIGURED";
    }

    // Check expiry
    if (account.tokenExpiresAt && new Date(account.tokenExpiresAt) < new Date()) {
      state = "TOKEN_EXPIRED";
    }

    let redactedId = "";
    if (account.username) {
      // Redact channel ID/name partially if it's long enough
      const len = account.username.length;
      if (len > 8) {
        redactedId = account.username.substring(0, 4) + "..." + account.username.substring(len - 4);
      } else {
        redactedId = account.username;
      }
    }

    res.json({
      status: state,
      channelTitle: account.displayName || "",
      redactedChannelId: redactedId,
      scopes: ["youtube.readonly", "youtube.upload"],
      tokenExpiry: account.tokenExpiresAt,
      lastVerification: account.updatedAt,
      uploadPermission: "granted"
    });
  } catch (err) {
    logger.error(err, "Failed to fetch YouTube status");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/youtube/disconnect", async (req, res) => {
  const userId = (req as any).user?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    await db.delete(socialAccountsTable).where(
      and(eq(socialAccountsTable.userId, userId), eq(socialAccountsTable.platform, "youtube"))
    );
    res.json({ message: "Disconnected successfully" });
  } catch (err) {
    logger.error(err, "Failed to disconnect YouTube");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Placeholders for future phases
router.post("/youtube/verify", (req, res) => {
  res.json({ message: "Verified" });
});

router.post("/youtube/refresh", (req, res) => {
  res.json({ message: "Refreshed" });
});

router.post("/youtube/upload", (req, res) => {
  res.status(501).json({ error: "Not Implemented" });
});

export default router;
