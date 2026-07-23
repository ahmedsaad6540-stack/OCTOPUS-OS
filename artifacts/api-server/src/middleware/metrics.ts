import client from "prom-client";
import type { NextFunction, Request, Response } from "express";

/**
 * A real `prom-client` registry — default Node.js process metrics (event
 * loop lag, heap, GC, file descriptors) plus HTTP request counters/
 * histograms collected by `httpMetricsMiddleware` below. Scraped by
 * `GET /api/metrics` in the standard Prometheus text exposition format.
 */
export const metricsRegistry = new client.Registry();
client.collectDefaultMetrics({ register: metricsRegistry });

export const httpRequestsTotal = new client.Counter({
  name: "octopus_http_requests_total",
  help: "Total HTTP requests handled, labeled by method, matched route pattern, and status code",
  labelNames: ["method", "route", "status_code"] as const,
  registers: [metricsRegistry],
});

export const httpRequestDurationSeconds = new client.Histogram({
  name: "octopus_http_request_duration_seconds",
  help: "HTTP request duration in seconds, labeled by method, matched route pattern, and status code",
  labelNames: ["method", "route", "status_code"] as const,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [metricsRegistry],
});

/**
 * Records every request's method/route/status/duration. Uses the matched
 * route *pattern* (`req.route.path`), same as the audit middleware, so a
 * UUID or other path parameter never becomes its own metric label
 * (unbounded label cardinality is a real Prometheus footgun — this avoids
 * it structurally rather than by convention).
 */
export function httpMetricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const routePath = (req.route?.path as string | undefined) ?? req.path.split("/").slice(0, 3).join("/");
    const labels = { method: req.method, route: routePath, status_code: String(res.statusCode) };
    const durationSeconds = Number(process.hrtime.bigint() - start) / 1e9;

    httpRequestsTotal.inc(labels);
    httpRequestDurationSeconds.observe(labels, durationSeconds);
  });

  next();
}
