import { Router, type IRouter } from "express";
import { agentManager } from "../lib/agent-manager.js";
import { AgentExecutorNotConfiguredError, AgentNotInvocableError } from "@workspace/agent-manager";
import { NoDefaultProviderError, UnknownProviderTypeError } from "@workspace/ai-provider-manager";
import type { AgentStatus, CreateAgentInput, UpdateAgentInput } from "@workspace/agent-manager";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";

const router: IRouter = Router();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STATUSES: AgentStatus[] = ["active", "disabled"];

function validateCreateInput(body: unknown): { error: string } | { input: CreateAgentInput } {
  if (body === null || typeof body !== "object") return { error: "body must be an object" };
  const b = body as Record<string, unknown>;
  if (typeof b["name"] !== "string" || b["name"].length === 0) return { error: "name is required" };
  if (typeof b["instructions"] !== "string" || b["instructions"].length === 0) {
    return { error: "instructions is required" };
  }
  if (b["capabilities"] !== undefined) {
    if (!Array.isArray(b["capabilities"]) || !b["capabilities"].every((c) => typeof c === "string")) {
      return { error: "capabilities must be an array of strings" };
    }
  }
  if (b["status"] !== undefined && !STATUSES.includes(b["status"] as AgentStatus)) {
    return { error: `status must be one of: ${STATUSES.join(", ")}` };
  }

  const input: CreateAgentInput = { name: b["name"], instructions: b["instructions"] };
  if (typeof b["description"] === "string") input.description = b["description"];
  if (Array.isArray(b["capabilities"])) input.capabilities = b["capabilities"] as string[];
  if (typeof b["status"] === "string") input.status = b["status"] as AgentStatus;
  return { input };
}

function validateUpdateInput(body: unknown): { error: string } | { input: UpdateAgentInput } {
  if (body === null || typeof body !== "object") return { error: "body must be an object" };
  const b = body as Record<string, unknown>;
  const input: UpdateAgentInput = {};
  if (b["name"] !== undefined) {
    if (typeof b["name"] !== "string" || b["name"].length === 0) return { error: "name must be a non-empty string" };
    input.name = b["name"];
  }
  if (b["description"] !== undefined) {
    if (typeof b["description"] !== "string") return { error: "description must be a string" };
    input.description = b["description"];
  }
  if (b["instructions"] !== undefined) {
    if (typeof b["instructions"] !== "string" || b["instructions"].length === 0) {
      return { error: "instructions must be a non-empty string" };
    }
    input.instructions = b["instructions"];
  }
  if (b["capabilities"] !== undefined) {
    if (!Array.isArray(b["capabilities"]) || !b["capabilities"].every((c) => typeof c === "string")) {
      return { error: "capabilities must be an array of strings" };
    }
    input.capabilities = b["capabilities"] as string[];
  }
  if (b["status"] !== undefined) {
    if (!STATUSES.includes(b["status"] as AgentStatus)) return { error: `status must be one of: ${STATUSES.join(", ")}` };
    input.status = b["status"] as AgentStatus;
  }
  return { input };
}

/**
 * Agent registration, lifecycle, and run history. Mutating endpoints are
 * admin-only, same rationale as the Rule Engine's routes: an agent is a
 * system-wide capability, not per-user data. `POST /:id/invoke` is open to
 * any authenticated user — invoking an existing, enabled agent is the
 * normal way this module gets used day to day.
 */
router.post("/agents", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (req.user!.role !== "admin") {
      res.status(403).json({ error: "Forbidden", message: "Only admins can create agents" });
      return;
    }
    const validated = validateCreateInput(req.body);
    if ("error" in validated) {
      res.status(400).json({ error: "Bad Request", message: validated.error });
      return;
    }
    const agent = await agentManager.create({ ...validated.input, userId: req.user!.userId });
    res.status(201).json({ agent });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/agents", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { status, limit } = req.query;
    if (typeof status === "string" && !STATUSES.includes(status as AgentStatus)) {
      res.status(400).json({ error: "Bad Request", message: `status must be one of: ${STATUSES.join(", ")}` });
      return;
    }
    const parsedLimit = typeof limit === "string" ? Number(limit) : undefined;
    const agents = await agentManager.list({
      status: typeof status === "string" ? (status as AgentStatus) : undefined,
      limit: Number.isFinite(parsedLimit) ? parsedLimit : undefined,
    });
    res.json({ agents });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/agents/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params as { id: string };
    if (!UUID_RE.test(id)) {
      res.status(400).json({ error: "Bad Request", message: "id must be a UUID" });
      return;
    }
    const agent = await agentManager.get(id);
    if (!agent) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    res.json({ agent });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/agents/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (req.user!.role !== "admin") {
      res.status(403).json({ error: "Forbidden", message: "Only admins can update agents" });
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
    const agent = await agentManager.update(id, validated.input);
    if (!agent) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    res.json({ agent });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/agents/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (req.user!.role !== "admin") {
      res.status(403).json({ error: "Forbidden", message: "Only admins can delete agents" });
      return;
    }
    const { id } = req.params as { id: string };
    if (!UUID_RE.test(id)) {
      res.status(400).json({ error: "Bad Request", message: "id must be a UUID" });
      return;
    }
    const deleted = await agentManager.delete(id);
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

router.post("/agents/:id/enable", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (req.user!.role !== "admin") {
      res.status(403).json({ error: "Forbidden", message: "Only admins can enable agents" });
      return;
    }
    const { id } = req.params as { id: string };
    if (!UUID_RE.test(id)) {
      res.status(400).json({ error: "Bad Request", message: "id must be a UUID" });
      return;
    }
    const agent = await agentManager.enable(id);
    if (!agent) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    res.json({ agent });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/agents/:id/disable", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (req.user!.role !== "admin") {
      res.status(403).json({ error: "Forbidden", message: "Only admins can disable agents" });
      return;
    }
    const { id } = req.params as { id: string };
    if (!UUID_RE.test(id)) {
      res.status(400).json({ error: "Bad Request", message: "id must be a UUID" });
      return;
    }
    const agent = await agentManager.disable(id);
    if (!agent) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    res.json({ agent });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/agents/:id/invoke", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params as { id: string };
    if (!UUID_RE.test(id)) {
      res.status(400).json({ error: "Bad Request", message: "id must be a UUID" });
      return;
    }
    const run = await agentManager.invoke(id, req.body ?? {}, req.user!.userId);
    res.status(202).json({ run });
  } catch (err) {
    if (err instanceof AgentNotInvocableError) {
      res.status(404).json({ error: "Not Found", message: err.message });
      return;
    }
    if (err instanceof AgentExecutorNotConfiguredError) {
      res.status(501).json({ error: "Not Implemented", message: err.message });
      return;
    }
    if (err instanceof NoDefaultProviderError || err instanceof UnknownProviderTypeError) {
      res.status(503).json({ error: "Service Unavailable", message: err.message });
      return;
    }
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/agents/:id/runs", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params as { id: string };
    if (!UUID_RE.test(id)) {
      res.status(400).json({ error: "Bad Request", message: "id must be a UUID" });
      return;
    }
    const { limit } = req.query;
    const parsedLimit = typeof limit === "string" ? Number(limit) : undefined;
    const runs = await agentManager.listRuns({
      agentId: id,
      limit: Number.isFinite(parsedLimit) ? parsedLimit : undefined,
    });
    res.json({ runs });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
