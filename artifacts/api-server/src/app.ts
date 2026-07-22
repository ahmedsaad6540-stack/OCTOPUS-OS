import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";
import { auditLogger } from "./lib/audit-observability.js";
import { createAuditMiddleware } from "./middleware/audit.js";
import { securityHeaders, apiRateLimiter } from "./middleware/security.js";
import { httpMetricsMiddleware } from "./middleware/metrics.js";

const app: Express = express();

app.set("trust proxy", 1); // Trust first proxy (e.g., Railway/Cloudflare)
app.use(securityHeaders);
app.use("/api", apiRateLimiter); // Apply rate limiter globally to /api routes


app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(httpMetricsMiddleware);
app.use(createAuditMiddleware(auditLogger));

import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "../public")));

import { errorHandler } from "./middleware/error.js";

app.use("/api", apiRateLimiter, router);

import oauthRouter from "./routes/oauth.js";
app.use(oauthRouter); // Mount at root so /oauth/... works

app.get("/health", (req, res) => res.json({ status: "ok" }));
app.get("/readiness", (req, res) => res.json({ status: "ready" }));

// ── Legal pages for TikTok/Meta platform verification ─────────────────────
const LEGAL_HTML = (title: string, body: string) => `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} — OCTOPUS AI OS</title>
<style>body{font-family:system-ui,sans-serif;max-width:800px;margin:40px auto;padding:0 20px;line-height:1.7;color:#1a1a2e}h1{color:#6c63ff}a{color:#6c63ff}</style>
</head><body><h1>OCTOPUS AI OS</h1><h2>${title}</h2>${body}
<p style="margin-top:40px;color:#888;font-size:13px">Last updated: July 2026 · Contact: <a href="mailto:admin@octopus.ai">admin@octopus.ai</a></p>
</body></html>`;

app.get("/legal/terms", (_req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(LEGAL_HTML("Terms of Service", `
    <p>Welcome to <strong>OCTOPUS AI OS</strong>. By using our platform, you agree to these Terms of Service.</p>
    <h3>1. Use of Service</h3>
    <p>OCTOPUS AI OS is an AI-powered content creation and social media publishing platform. You must be 18 or older to use this service.</p>
    <h3>2. Content</h3>
    <p>You retain ownership of content you create. You grant us a license to process and publish content on your behalf to connected platforms (YouTube, TikTok, Facebook, Instagram).</p>
    <h3>3. Third-Party Integrations</h3>
    <p>Our platform integrates with TikTok, Meta (Facebook/Instagram), Google (YouTube), ElevenLabs, and HeyGen via official APIs. You agree to the terms of each platform you connect.</p>
    <h3>4. Prohibited Use</h3>
    <p>You may not use OCTOPUS AI OS to create content that violates TikTok, Meta, or Google community guidelines.</p>
    <h3>5. Limitation of Liability</h3>
    <p>OCTOPUS AI OS is provided "as is". We are not liable for damages arising from use of the service.</p>
    <h3>6. Contact</h3>
    <p>For questions, contact: <a href="mailto:admin@octopus.ai">admin@octopus.ai</a></p>
  `));
});

app.get("/legal/privacy", (_req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(LEGAL_HTML("Privacy Policy", `
    <p><strong>OCTOPUS AI OS</strong> ("we", "us") is committed to protecting your privacy.</p>
    <h3>1. Information We Collect</h3>
    <p>We collect account information (name, email), OAuth tokens from connected social platforms, and content data you choose to publish.</p>
    <h3>2. How We Use Your Information</h3>
    <p>We use your information solely to provide the OCTOPUS AI OS service — generating content and publishing it to your connected social media accounts.</p>
    <h3>3. TikTok Integration</h3>
    <p>When you connect TikTok, we request OAuth tokens to publish videos on your behalf. We use TikTok's official OAuth v2 API. We never store your TikTok password. You can revoke access at any time via TikTok Settings → Security → Manage App Permissions.</p>
    <h3>4. Meta (Facebook/Instagram) Integration</h3>
    <p>When you connect Facebook or Instagram, we request page access tokens via the Meta Graph API. We use these tokens only to publish content you create on OCTOPUS AI OS.</p>
    <h3>5. Data Deletion</h3>
    <p>To delete your data, email <a href="mailto:admin@octopus.ai">admin@octopus.ai</a> or disconnect your accounts from the Social Hub. We will delete all associated tokens and data within 30 days.</p>
    <h3>6. Security</h3>
    <p>All tokens are stored encrypted. We use HTTPS for all communications.</p>
    <h3>7. Contact</h3>
    <p>For privacy questions: <a href="mailto:admin@octopus.ai">admin@octopus.ai</a></p>
  `));
});

// Data deletion callback for Meta/TikTok compliance
app.get("/legal/data-deletion", (_req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(LEGAL_HTML("Data Deletion Instructions", `
    <p>To request deletion of your data from OCTOPUS AI OS:</p>
    <ol>
      <li>Email <a href="mailto:admin@octopus.ai">admin@octopus.ai</a> with subject "Data Deletion Request"</li>
      <li>Or disconnect your accounts from the Social Hub in the app</li>
    </ol>
    <p>We will process your request within 30 days.</p>
  `));
});
app.post("/legal/data-deletion", (req, res) => {
  res.json({ url: "https://api-server-production-4801.up.railway.app/legal/data-deletion", confirmation_code: `DEL-${Date.now()}` });
});

app.get("/", (req, res) => {
  res.redirect(process.env.FRONTEND_URL || "https://finalsnapshot.vercel.app");
});

app.use(errorHandler);

export default app;
