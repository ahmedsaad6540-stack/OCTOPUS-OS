import { Router } from "express";
import { db } from "@workspace/db";
import { socialAccountsTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { logger } from "../lib/logger.js";
import fs from "node:fs";
import path from "node:path";

const router = Router();

const CLIENT_ID = process.env.YOUTUBE_CLIENT_ID || "";
const CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET || "";

// Helper to update .env files with YOUTUBE_REFRESH_TOKEN and YOUTUBE_ACCESS_TOKEN
function saveTokensToEnvFiles(refreshToken: string, accessToken: string) {
  const envPaths = [
    path.resolve(process.cwd(), "../../.env"),
    path.resolve(process.cwd(), ".env")
  ];

  for (const envPath of envPaths) {
    try {
      if (fs.existsSync(envPath)) {
        let content = fs.readFileSync(envPath, "utf-8");
        
        // Update or append YOUTUBE_REFRESH_TOKEN
        if (content.includes("YOUTUBE_REFRESH_TOKEN=")) {
          content = content.replace(/YOUTUBE_REFRESH_TOKEN=.*(\r?\n|$)/g, `YOUTUBE_REFRESH_TOKEN="${refreshToken}"$1`);
        } else {
          content += `\nYOUTUBE_REFRESH_TOKEN="${refreshToken}"\n`;
        }

        // Update or append YOUTUBE_ACCESS_TOKEN
        if (content.includes("YOUTUBE_ACCESS_TOKEN=")) {
          content = content.replace(/YOUTUBE_ACCESS_TOKEN=.*(\r?\n|$)/g, `YOUTUBE_ACCESS_TOKEN="${accessToken}"$1`);
        } else {
          content += `YOUTUBE_ACCESS_TOKEN="${accessToken}"\n`;
        }

        fs.writeFileSync(envPath, content, "utf-8");
        logger.info({ envPath }, "Successfully updated YOUTUBE_REFRESH_TOKEN and YOUTUBE_ACCESS_TOKEN in env file");
      }
    } catch (err) {
      logger.error({ err, envPath }, "Failed to update env file with YouTube tokens");
    }
  }
}

// 1. GET /auth/youtube/login - Redirects to Google OAuth
router.get("/auth/youtube/login", (req, res) => {
  const redirectUri = req.query.redirect_uri || `${req.protocol}://${req.get("host")}/auth/youtube/callback`;
  const scope = "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly";
  const state = String(req.query.state || "user_youtube_oauth");

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(String(redirectUri))}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent&state=${encodeURIComponent(state)}`;
  
  logger.info({ redirectUri, authUrl }, "Redirecting user to Google OAuth for YouTube");
  res.redirect(authUrl);
});

// 2. GET /auth/youtube/callback - Handles Google OAuth Callback directly on backend
router.get("/auth/youtube/callback", async (req, res) => {
  const { code, state, error } = req.query as { code?: string; state?: string; error?: string };

  if (error) {
    logger.error({ error }, "Google OAuth returned error");
    res.status(400).send(`<h1>❌ Google OAuth Error</h1><p>${error}</p>`);
    return;
  }

  if (!code) {
    res.status(400).send("<h1>❌ Missing Authorization Code</h1>");
    return;
  }

  const redirectUri = `${req.protocol}://${req.get("host")}/auth/youtube/callback`;

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      logger.error({ errText, status: tokenRes.status }, "Token exchange failed with Google");
      res.status(400).send(`
        <div style="font-family: sans-serif; padding: 30px; max-w: 600px; margin: auto; background: #1a102c; color: white; border-radius: 12px;">
          <h2 style="color: #f87171;">❌ Token Exchange Failed</h2>
          <p>Status Code: ${tokenRes.status}</p>
          <pre style="background: #0d0614; padding: 15px; border-radius: 8px; color: #ffb86c; overflow: auto;">${errText}</pre>
          <p style="font-size: 13px; color: #a855f7;">Make sure this redirect URI (<code>${redirectUri}</code>) is exactly added to Authorized redirect URIs in Google Cloud Console.</p>
        </div>
      `);
      return;
    }

    const tokenData = await tokenRes.json() as { access_token: string; refresh_token?: string; expires_in?: number };
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token || process.env.YOUTUBE_REFRESH_TOKEN || "mock_refresh_token_or_previously_saved";

    if (tokenData.refresh_token) {
      saveTokensToEnvFiles(refreshToken, accessToken);
      process.env.YOUTUBE_REFRESH_TOKEN = refreshToken;
      process.env.YOUTUBE_ACCESS_TOKEN = accessToken;
    }

    console.log("\n====================================================================");
    console.log("📺 YOUTUBE OAUTH 2.0 TOKENS RECEIVED & SAVED!");
    console.log("====================================================================");
    console.log(`access_token:  ${accessToken}`);
    console.log(`refresh_token: ${refreshToken}`);
    console.log("====================================================================\n");

    // Try to update socialAccountsTable in DB
    try {
      const [existing] = await db
        .select()
        .from(socialAccountsTable)
        .where(eq(socialAccountsTable.platform, "youtube"))
        .limit(1);

      if (existing) {
        await db.update(socialAccountsTable).set({
          accessToken,
          refreshToken,
          status: "connected",
          updatedAt: new Date()
        }).where(eq(socialAccountsTable.id, existing.id));
      } else {
        await db.insert(socialAccountsTable).values({
          userId: "admin-default",
          platform: "youtube",
          displayName: "YouTube Official Channel",
          username: "Connected Channel",
          accessToken,
          refreshToken,
          status: "connected",
        });
      }
    } catch (dbErr) {
      logger.warn({ dbErr }, "Could not update socialAccountsTable in DB, but tokens are saved to .env");
    }

    res.send(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <title>تم ربط YouTube بنجاح</title>
        <style>
          body { background: #0a0614; color: #fff; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; }
          .card { background: #130d2a; border: 1px solid #7e22ce; border-radius: 20px; padding: 35px; max-w: 650px; width: 100%; box-shadow: 0 10px 30px rgba(126, 34, 206, 0.3); text-align: center; }
          h1 { color: #34d399; font-size: 24px; margin-bottom: 10px; }
          p { color: #d8b4fe; font-size: 14px; margin-bottom: 25px; }
          .token-box { background: #080410; border: 1px solid #4c1d95; border-radius: 12px; padding: 15px; margin-bottom: 20px; text-align: left; direction: ltr; word-break: break-all; }
          .label { font-size: 11px; color: #a855f7; text-transform: uppercase; font-weight: bold; margin-bottom: 5px; display: block; }
          .value { font-family: monospace; font-size: 13px; color: #38bdf8; }
          .btn { display: inline-block; background: linear-gradient(135deg, #7e22ce, #4f46e5); color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 12px; font-weight: bold; margin-top: 15px; transition: 0.3s; }
          .btn:hover { opacity: 0.9; }
        </style>
      </head>
      <body>
        <div class="card">
          <div style="font-size: 48px; margin-bottom: 15px;">📺 ✅</div>
          <h1>تم تسجيل الدخول والحصول على Refresh Token بنجاح!</h1>
          <p>تم حفظ <code>refresh_token</code> و <code>access_token</code> في ملف <code>.env</code> وفي قاعدة البيانات مباشرة.</p>
          
          <div class="token-box">
            <span class="label">YOUTUBE_REFRESH_TOKEN (تم حفظه في .env)</span>
            <div class="value">${refreshToken}</div>
          </div>

          <div class="token-box">
            <span class="label">YOUTUBE_ACCESS_TOKEN</span>
            <div class="value">${accessToken}</div>
          </div>

          <a href="http://localhost:5173/social" class="btn">العودة إلى لوحة التحكم (Social Hub)</a>
        </div>
      </body>
      </html>
    `);
  } catch (err) {
    logger.error({ err }, "Unexpected error in YouTube callback");
    res.status(500).send("Internal Server Error during YouTube OAuth callback");
  }
});

// 3. POST /auth/youtube/exchange - For Frontend Callback Page to exchange code via API
router.post("/auth/youtube/exchange", async (req, res) => {
  const { code, redirect_uri } = req.body as { code?: string; redirect_uri?: string };

  if (!code) {
    res.status(400).json({ error: "Missing authorization code" });
    return;
  }

  const redirectUri = redirect_uri || `${req.protocol}://${req.get("host")}/auth/youtube/callback`;

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      logger.error({ errText, status: tokenRes.status }, "Frontend token exchange failed with Google");
      res.status(400).json({ error: "Token exchange failed", details: errText });
      return;
    }

    const tokenData = await tokenRes.json() as { access_token: string; refresh_token?: string; expires_in?: number };
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token || process.env.YOUTUBE_REFRESH_TOKEN || "";

    if (tokenData.refresh_token) {
      saveTokensToEnvFiles(refreshToken, accessToken);
      process.env.YOUTUBE_REFRESH_TOKEN = refreshToken;
      process.env.YOUTUBE_ACCESS_TOKEN = accessToken;
    }

    console.log("\n====================================================================");
    console.log("📺 YOUTUBE OAUTH 2.0 TOKENS RECEIVED VIA API!");
    console.log("====================================================================");
    console.log(`access_token:  ${accessToken}`);
    console.log(`refresh_token: ${refreshToken}`);
    console.log("====================================================================\n");

    res.json({
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: tokenData.expires_in
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "Internal error exchanging token", details: msg });
  }
});

export default router;
