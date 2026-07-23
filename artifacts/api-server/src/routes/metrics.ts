import { Router, type IRouter } from "express";
import { metricsRegistry } from "../middleware/metrics.js";

const router: IRouter = Router();

/**
 * Standard Prometheus scrape endpoint — no auth, matching normal
 * Prometheus/scraper conventions (a scraper typically can't carry a
 * session's JWT). If this needs to be restricted in a given deployment,
 * that's a network-policy/reverse-proxy decision, not something to bolt
 * `requireAuth` onto and break real scrapers.
 */
router.get("/metrics", async (_req, res) => {
  res.set("Content-Type", metricsRegistry.contentType);
  res.send(await metricsRegistry.metrics());
});

export default router;
