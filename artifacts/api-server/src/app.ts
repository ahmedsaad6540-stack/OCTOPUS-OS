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

app.get("/", (req, res) => {
  res.redirect(process.env.FRONTEND_URL || "https://finalsnapshot.vercel.app");
});

app.use(errorHandler);

export default app;
