import helmet from "helmet";
import rateLimit from "express-rate-limit";
import type { RequestHandler } from "express";

/**
 * Real HTTP security headers via `helmet` — HSTS, X-Content-Type-Options,
 * frame denial, referrer policy, etc. `contentSecurityPolicy` is left off:
 * this is a JSON API, not a page-rendering server, so a CSP tuned for HTML
 * would either do nothing useful or need per-frontend tuning that belongs
 * in `artifacts/octopus-os`/`artifacts/mockup-sandbox` themselves, not here.
 */
export const securityHeaders: RequestHandler = helmet({
  contentSecurityPolicy: false,
});

/**
 * General API rate limit: 300 requests per IP per 15 minutes across all
 * `/api/*` routes. Generous enough not to interfere with normal use of a
 * multi-module system (a single workflow run can fan out into several
 * requests) while still bounding abuse.
 */
export const apiRateLimiter: RequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too Many Requests", message: "Rate limit exceeded, try again later" },
});

/**
 * Tighter limit for authentication endpoints specifically — credential
 * stuffing / brute-force protection independent of the general API limit.
 * 20 attempts per IP per 15 minutes.
 */
export const authRateLimiter: RequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too Many Requests", message: "Too many authentication attempts, try again later" },
});
