import pino from "pino";
import { trace } from "@opentelemetry/api";

const isProduction = process.env.NODE_ENV === "production";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  redact: [
    "req.headers.authorization",
    "req.headers.cookie",
    "res.headers['set-cookie']",
  ],
  // Every log line picks up the current span's traceId/spanId, if one is
  // active — real correlation between structured logs and distributed
  // traces (see ../tracing.ts), not a placeholder field. `mixin` runs on
  // every log call, cheaply, and adds nothing when no span is active.
  mixin() {
    const span = trace.getActiveSpan();
    if (!span) return {};
    const ctx = span.spanContext();
    return { traceId: ctx.traceId, spanId: ctx.spanId };
  },
  ...(isProduction
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: { colorize: true },
        },
      }),
});
