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

app.use(securityHeaders);

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

app.use("/api", apiRateLimiter, router);

export default app;
