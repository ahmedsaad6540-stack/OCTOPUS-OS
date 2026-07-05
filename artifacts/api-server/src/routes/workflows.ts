import { Router, type IRouter } from "express";
import { workflowEngine } from "../lib/workflow-engine.js";
import { WorkflowDisabledError, WorkflowNotFoundError } from "@workspace/workflow-engine";
import type { CreateWorkflowInput, UpdateWorkflowInput, WorkflowStatus, WorkflowStep } from "@workspace/workflow-engine";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";

const router: IRouter = Router();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STATUSES: WorkflowStatus[] = ["active", "disabled"];
const STEP_TYPES = new Set(["tool", "agent", "task", "event"]);

function isValidStep(value: unknown): value is WorkflowStep {
  if (value === null || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  if (typeof v["type"] !== "string" || !STEP_TYPES.has(v["type"])) return false;
  if (typeof v["name"] !== "string" || v["name"].length === 0) return false;
  switch (v["type"]) {
    case "tool":
      return typeof v["toolName"] === "string" && "input" in v;
    case "agent":
      return typeof v["agentId"] === "string" && "input" in v;
    case "task":
      return typeof v["taskType"] === "string" && "payload" in v;
    case "event":
      return typeof v["eventType"] === "string" && "payload" in v;
    default:
      return false;
  }
}

function validateCreateInput(body: unknown): { error: string } | { input: CreateWorkflowInput } {
  if (body === null || typeof body !== "object") return { error: "body must be an object" };
  const b = body as Record<string, unknown>;
  if (typeof b["name"] !== "string" || b["name"].length === 0) return { error: "name is required" };
  if (!Array.isArray(b["steps"]) || !b["steps"].every(isValidStep)) {
    return { error: "steps must be an array of valid workflow steps" };
  }
  if (b["status"] !== undefined && !STATUSES.includes(b["status"] as WorkflowStatus)) {
    return { error: `status must be one of: ${STATUSES.join(", ")}` };
  }

  const input: CreateWorkflowInput = { name: b["name"], steps: b["steps"] as WorkflowStep[] };
  if (typeof b["description"] === "string") input.description = b["description"];
  if (typeof b["status"] === "string") input.status = b["status"] as WorkflowStatus;
  return { input };
}

function validateUpdateInput(body: unknown): { error: string } | { input: UpdateWorkflowInput } {
  if (body === null || typeof body !== "object") return { error: "body must be an object" };
  const b = body as Record<string, unknown>;
  const input: UpdateWorkflowInput = {};
  if (b["name"] !== undefined) {
    if (typeof b["name"] !== "string" || b["name"].length === 0) return { error: "name must be a non-empty string" };
    input.name = b["name"];
  }
  if (b["description"] !== undefined) {
    if (typeof b["description"] !== "string") return { error: "description must be a string" };
    input.description = b["description"];
  }
  if (b["steps"] !== undefined) {
    if (!Array.isArray(b["steps"]) || !b["steps"].every(isValidStep)) {
      return { error: "steps must be an array of valid workflow steps" };
    }
    input.steps = b["steps"] as WorkflowStep[];
  }
  if (b["status"] !== undefined) {
    if (!STATUSES.includes(b["status"] as WorkflowStatus)) return { error: `status must be one of: ${STATUSES.join(", ")}` };
    input.status = b["status"] as WorkflowStatus;
  }
  return { input };
}

/**
 * Workflow registration, lifecycle, and run history. Mutating endpoints are
 * admin-only — a workflow's steps determine what tasks get enqueued, which
 * agents/tools run, and what events get published, so defining one is a
 * system-wide operation. `POST /:id/run` is open to any authenticated user.
 */
router.post("/workflows", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (req.user!.role !== "admin") {
      res.status(403).json({ error: "Forbidden", message: "Only admins can create workflows" });
      return;
    }
    const validated = validateCreateInput(req.body);
    if ("error" in validated) {
      res.status(400).json({ error: "Bad Request", message: validated.error });
      return;
    }
    const workflow = await workflowEngine.create({ ...validated.input, userId: req.user!.userId });
    res.status(201).json({ workflow });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/workflows", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { status, limit } = req.query;
    if (typeof status === "string" && !STATUSES.includes(status as WorkflowStatus)) {
      res.status(400).json({ error: "Bad Request", message: `status must be one of: ${STATUSES.join(", ")}` });
      return;
    }
    const parsedLimit = typeof limit === "string" ? Number(limit) : undefined;
    const workflows = await workflowEngine.list({
      status: typeof status === "string" ? (status as WorkflowStatus) : undefined,
      limit: Number.isFinite(parsedLimit) ? parsedLimit : undefined,
    });
    res.json({ workflows });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/workflows/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params as { id: string };
    if (!UUID_RE.test(id)) {
      res.status(400).json({ error: "Bad Request", message: "id must be a UUID" });
      return;
    }
    const workflow = await workflowEngine.get(id);
    if (!workflow) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    res.json({ workflow });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/workflows/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (req.user!.role !== "admin") {
      res.status(403).json({ error: "Forbidden", message: "Only admins can update workflows" });
      return;
    }
    const { id } = req.params as { id: string };
    if (!UUID_RE.test(id)) {
      res.status(400).json({ error: "Bad Request", message: "id must be a UUID" });
      return;
    }
    const validated = validateUpdateInput(req.body);
    if ("error" in validated) {
      res.status(400).json({ error: "Bad Request", message: validated.error });
      return;
    }
    const workflow = await workflowEngine.update(id, validated.input);
    if (!workflow) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    res.json({ workflow });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/workflows/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (req.user!.role !== "admin") {
      res.status(403).json({ error: "Forbidden", message: "Only admins can delete workflows" });
      return;
    }
    const { id } = req.params as { id: string };
    if (!UUID_RE.test(id)) {
      res.status(400).json({ error: "Bad Request", message: "id must be a UUID" });
      return;
    }
    const deleted = await workflowEngine.delete(id);
    if (!deleted) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/workflows/:id/enable", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (req.user!.role !== "admin") {
      res.status(403).json({ error: "Forbidden", message: "Only admins can enable workflows" });
      return;
    }
    const { id } = req.params as { id: string };
    if (!UUID_RE.test(id)) {
      res.status(400).json({ error: "Bad Request", message: "id must be a UUID" });
      return;
    }
    const workflow = await workflowEngine.enable(id);
    if (!workflow) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    res.json({ workflow });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/workflows/:id/disable", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (req.user!.role !== "admin") {
      res.status(403).json({ error: "Forbidden", message: "Only admins can disable workflows" });
      return;
    }
    const { id } = req.params as { id: string };
    if (!UUID_RE.test(id)) {
      res.status(400).json({ error: "Bad Request", message: "id must be a UUID" });
      return;
    }
    const workflow = await workflowEngine.disable(id);
    if (!workflow) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    res.json({ workflow });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/workflows/:id/run", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params as { id: string };
    if (!UUID_RE.test(id)) {
      res.status(400).json({ error: "Bad Request", message: "id must be a UUID" });
      return;
    }
    const run = await workflowEngine.run(id, req.body ?? {}, req.user!.userId);
    res.status(202).json({ run });
  } catch (err) {
    if (err instanceof WorkflowNotFoundError) {
      res.status(404).json({ error: "Not Found", message: err.message });
      return;
    }
    if (err instanceof WorkflowDisabledError) {
      res.status(409).json({ error: "Conflict", message: err.message });
      return;
    }
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/workflows/:id/runs", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params as { id: string };
    if (!UUID_RE.test(id)) {
      res.status(400).json({ error: "Bad Request", message: "id must be a UUID" });
      return;
    }
    const { limit } = req.query;
    const parsedLimit = typeof limit === "string" ? Number(limit) : undefined;
    const runs = await workflowEngine.listRuns({
      workflowId: id,
      limit: Number.isFinite(parsedLimit) ? parsedLimit : undefined,
    });
    res.json({ runs });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
