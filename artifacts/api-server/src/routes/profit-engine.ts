// artifacts/api-server/src/routes/profit-engine.ts
// -------------------------------------------------
// Express router exposing the ProfitEngine public API.
// Only methods that exist on ProfitEngine and its public sub-engines are used.

import { Router } from "express";
import { profitEngine } from "../lib/profit-engine.js";

const router = Router();

/* GET /api/profit-engine/dashboard
   Required query param: userId */
router.get("/dashboard", async (req, res) => {
  const userId = String(req.query.userId ?? "");
  const data = await profitEngine.getDashboard(userId);
  res.json(data);
});

/* POST /api/profit-engine/sale */
router.post("/sale", async (req, res) => {
  const result = await profitEngine.recordSale(req.body);
  res.json(result);
});

/* POST /api/profit-engine/trigger-hunt
   Delegates to viralDetector.scanTrends() — the actual hunt method. */
router.post("/trigger-hunt", async (_req, res) => {
  const signals = await profitEngine.viralDetector.scanTrends();
  res.json({ signals });
});

/* POST /api/profit-engine/trigger-scale
   Returns current budget status — callers use this to decide scaling. */
router.post("/trigger-scale", async (req, res) => {
  const userId = (req.body as { userId?: string })?.userId;
  const status = await profitEngine.budgetManager.getBudgetStatus(userId);
  res.json({ budgetStatus: status });
});

/* POST /api/profit-engine/proposals/:id/approve */
router.post("/proposals/:id/approve", async (req, res) => {
  const { id } = req.params;
  const result = await profitEngine.evolution.approve(id);
  res.json(result);
});

/* POST /api/profit-engine/proposals/:id/reject */
router.post("/proposals/:id/reject", async (req, res) => {
  const { id } = req.params;
  const result = await profitEngine.evolution.reject(id);
  res.json(result);
});

/* PUT /api/profit-engine/settings/mode */
router.put("/settings/mode", async (req, res) => {
  const { mode } = req.body as { mode: string };
  profitEngine.setMode(mode as Parameters<typeof profitEngine.setMode>[0]);
  res.sendStatus(204);
});

/* GET /api/profit-engine/graph/traverse
   Required query params: fromNodeId, relation
   Optional query param:  depth */
router.get("/graph/traverse", async (req, res) => {
  const fromNodeId = String(req.query.fromNodeId ?? "");
  const relation   = String(req.query.relation ?? "");
  const depth      = req.query.depth ? Number(req.query.depth) : undefined;
  const nodes = await profitEngine.knowledgeGraph.traverse(fromNodeId, relation, depth);
  res.json(nodes);
});

/* GET /api/profit-engine/goals/active
   Required query param: userId */
router.get("/goals/active", async (req, res) => {
  const userId = String(req.query.userId ?? "");
  const status = await profitEngine.goalEngine.getStatus(userId);
  res.json(status);
});

/* GET /api/profit-engine/budget/splits
   Optional query param: userId */
router.get("/budget/splits", async (req, res) => {
  const userId = req.query.userId ? String(req.query.userId) : undefined;
  const split = await profitEngine.budgetManager.getOrCreateSplit(userId);
  res.json(split);
});

export default router;

