import { Router } from "express";
import { db } from "@workspace/db";
import { socialAccountsTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { logger } from "../lib/logger.js";

const router = Router();

// ── CONNECT / REDIRECT ENDPOINT ──────────────────────────────────────────────
router.get("/oauth/:platform/connect", async (req, res) => {
  const { platform } = req.params;
  const userId = String(req.query.userId || "");

  if (!userId) {
    res.status(400).send("Bad Request: userId is required");
    return;
  }

  try {
    // Retrieve the user's configured developer Client ID (apiKey) from DB (best effort)
    let dbApiKey: string | null = null;
    try {
      const [config] = await db
        .select({ apiKey: socialAccountsTable.apiKey })
        .from(socialAccountsTable)
        .where(and(eq(socialAccountsTable.platform, platform), eq(socialAccountsTable.userId, userId)))
        .limit(1);
      dbApiKey = config?.apiKey || null;
    } catch {
      // Invalid UUID or DB error - proceed with env fallback
    }

    // Use env vars injected via Railway (set via railway variables set ...)
    let clientId = dbApiKey || "";
    if (!clientId) {
      if (platform === "tiktok") clientId = process.env.TIKTOK_CLIENT_KEY || "";
      else if (platform === "youtube") clientId = process.env.YOUTUBE_CLIENT_ID || "";
      else if (platform === "instagram" || platform === "facebook") clientId = process.env.FACEBOOK_APP_ID || "";
    }

    const apiUrl = process.env.API_URL || `${req.protocol}://${req.get("host")}`;
    const callbackUrl = `${apiUrl}/oauth/${platform}/callback`;
    const state = JSON.stringify({ userId });

    let authUrl = "";
    if (platform === "tiktok") {
      authUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${clientId}&scope=user.info.basic,video.publish&response_type=code&redirect_uri=${encodeURIComponent(callbackUrl)}&state=${encodeURIComponent(state)}`;
    } else if (platform === "youtube") {
      authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(callbackUrl)}&response_type=code&scope=https://www.googleapis.com/auth/youtube.upload%20https://www.googleapis.com/auth/youtube.readonly&access_type=offline&state=${encodeURIComponent(state)}&prompt=consent`;
    } else if (platform === "instagram" || platform === "facebook") {
      authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(callbackUrl)}&scope=pages_show_list,instagram_basic,instagram_content_publish&state=${encodeURIComponent(state)}`;
    } else {
      res.status(400).send("Unsupported platform for OAuth redirect");
      return;
    }

    if (!clientId) {
      res.status(400).send(`OAuth not configured for platform: ${platform}. Please add credentials in the Social Hub settings.`);
      return;
    }

    res.redirect(authUrl);
  } catch (err) {
    logger.error(err, "OAuth authorize redirect failed");
    res.status(500).send("Internal Server Error during redirection");
  }
});

// ── CALLBACK ENDPOINT ────────────────────────────────────────────────────────
router.get("/oauth/:platform/callback", async (req, res) => {
  const { platform } = req.params;
  const { code, state, error } = req.query as { code?: string; state?: string; error?: string };

  const frontendUrl = process.env.FRONTEND_URL || "https://finalsnapshot.vercel.app";
  if (error) {
    logger.error({ error }, `OAuth callback returned error for ${platform}`);
    res.redirect(`${frontendUrl}/?oauth_error=${encodeURIComponent(error)}`);
    return;
  }

  if (!code || !state) {
    res.status(400).send("Missing code or state");
    return;
  }

  try {
    const { userId } = JSON.parse(state) as { userId: string };

    // Fetch the client credentials saved by the user
    const [accConfig] = await db
      .select()
      .from(socialAccountsTable)
      .where(and(eq(socialAccountsTable.platform, platform), eq(socialAccountsTable.userId, userId)))
      .limit(1);

    let clientId = accConfig?.apiKey || "";
    let clientSecret = accConfig?.apiSecret || "";
    // Fallback to Railway env vars if DB doesn't have the credentials
    if (!clientId || !clientSecret) {
      if (platform === "tiktok") {
        clientId = clientId || process.env.TIKTOK_CLIENT_KEY || "";
        clientSecret = clientSecret || process.env.TIKTOK_CLIENT_SECRET || "";
      } else if (platform === "youtube") {
        clientId = clientId || process.env.YOUTUBE_CLIENT_ID || "";
        clientSecret = clientSecret || process.env.YOUTUBE_CLIENT_SECRET || "";
      } else if (platform === "instagram" || platform === "facebook") {
        clientId = clientId || process.env.FACEBOOK_APP_ID || "";
        clientSecret = clientSecret || process.env.FACEBOOK_APP_SECRET || "";
      }
    }
    const apiUrl = process.env.API_URL || `${req.protocol}://${req.get("host")}`;
    const callbackUrl = `${apiUrl}/oauth/${platform}/callback`;

    let accessToken = "";
    let refreshToken = "";
    let tokenExpiresAt: Date | null = null;
    let username = accConfig?.username || "";
    let displayName = accConfig?.displayName || "";
    let followers = accConfig?.followers || "0";

    // Perform actual HTTP exchange if user credentials are provided
    if (clientId && clientSecret && code && code !== "mock_code_123") {
      try {
        if (platform === "tiktok") {
          // Token exchange endpoint for TikTok V2
          const tokenRes = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              client_key: clientId,
              client_secret: clientSecret,
              code,
              grant_type: "authorization_code",
              redirect_uri: callbackUrl,
            }),
          });
          if (tokenRes.ok) {
            const tokenData = await tokenRes.json() as { access_token: string; refresh_token?: string; expires_in?: number; open_id?: string };
            accessToken = tokenData.access_token;
            if (tokenData.refresh_token) refreshToken = tokenData.refresh_token;
            if (tokenData.expires_in) tokenExpiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

            // Fetch real user info from TikTok API
            const infoRes = await fetch("https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name,username,follower_count", {
              headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (infoRes.ok) {
              const infoData = await infoRes.json() as { data?: { user?: { display_name?: string; username?: string; follower_count?: number } } };
              const userObj = infoData.data?.user;
              if (userObj) {
                displayName = userObj.display_name || displayName;
                username = userObj.username || username;
                followers = String(userObj.follower_count ?? followers);
              }
            }
          }
        } else if (platform === "youtube") {
          // Google Token exchange
          const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              client_id: clientId,
              client_secret: clientSecret,
              code,
              grant_type: "authorization_code",
              redirect_uri: callbackUrl,
            }),
          });
          if (tokenRes.ok) {
            const tokenData = await tokenRes.json() as { access_token: string; refresh_token?: string; expires_in?: number };
            accessToken = tokenData.access_token;
            if (tokenData.refresh_token) refreshToken = tokenData.refresh_token;
            if (tokenData.expires_in) tokenExpiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

            // Fetch YouTube Channel Info
            const channelRes = await fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true", {
              headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (channelRes.ok) {
              const channelData = await channelRes.json() as { items?: Array<{ snippet?: { title?: string }; statistics?: { subscriberCount?: string } }> };
              const item = channelData.items?.[0];
              if (item) {
                displayName = item.snippet?.title || displayName;
                username = item.snippet?.title || username;
                followers = item.statistics?.subscriberCount || followers;
              }
            }
          }
        } else if (platform === "instagram" || platform === "facebook") {
          // Meta OAuth exchange
          const tokenRes = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?client_id=${clientId}&redirect_uri=${encodeURIComponent(callbackUrl)}&client_secret=${clientSecret}&code=${code}`);
          if (tokenRes.ok) {
            const tokenData = await tokenRes.json() as { access_token: string; expires_in?: number };
            accessToken = tokenData.access_token;
            if (tokenData.expires_in) tokenExpiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

            if (platform === "facebook") {
              const pageRes = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`);
              if (pageRes.ok) {
                const pageData = await pageRes.json() as { data?: Array<{ id: string; name: string; access_token: string }> };
                const firstPage = pageData.data?.[0];
                if (firstPage) {
                  accessToken = firstPage.access_token; // Long-lived page token
                  displayName = firstPage.name;
                  username = firstPage.name;
                }
              }
            }
          }
        }
        
        if (!accessToken) {
          throw new Error("Failed to obtain access token from OAuth exchange");
        }
      } catch (exchangeErr) {
        logger.error(exchangeErr, `Real token exchange failed for ${platform}`);
        res.redirect(`${process.env.FRONTEND_URL || "https://finalsnapshot.vercel.app"}/?oauth_error=${encodeURIComponent("Token exchange failed")}`);
        return;
      }
    } else {
      res.redirect(`${frontendUrl}/?oauth_error=${encodeURIComponent("Invalid client credentials or code")}`);
      return;
    }

    const { SecretsManager } = await import("../lib/secrets-manager.js");
    const sm = SecretsManager.instance();
    const encryptedAccess = sm.encryptOptional(accessToken) || "";
    const encryptedRefresh = sm.encryptOptional(refreshToken) || "";

    // Save tokens and profile metrics back to database
    if (accConfig) {
      await db
        .update(socialAccountsTable)
        .set({
          accessToken: encryptedAccess,
          refreshToken: encryptedRefresh,
          tokenExpiresAt,
          status: "LIVE_VERIFIED",
          connectionSource: "real_oauth",
          username,
          displayName,
          followers,
          updatedAt: new Date()
        })
        .where(eq(socialAccountsTable.id, accConfig.id));
    } else {
      await db.insert(socialAccountsTable).values({
        userId,
        platform,
        displayName,
        username,
        accessToken: encryptedAccess,
        refreshToken: encryptedRefresh,
        tokenExpiresAt,
        status: "LIVE_VERIFIED",
        connectionSource: "real_oauth",
        followers,
      });
    }

    res.redirect(`${frontendUrl}/`);
  } catch (err) {
    logger.error(err, "OAuth callback processing error");
    res.status(500).send("OAuth integration processing failed");
  }
});

export default router;
