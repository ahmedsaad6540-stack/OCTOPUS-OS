import { Router, type IRouter } from "express";
import { ruleEngine } from "../lib/rule-engine.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";
import type { Condition, CreateRuleInput, UpdateRuleInput } from "@workspace/rule-engine";

const router: IRouter = Router();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const COMPARISON_OPS = new Set(["eq", "neq", "gt", "gte", "lt", "lte", "contains"]);

function isValidCondition(value: unknown, depth = 0): value is Condition {
  if (depth > 10 || value === null || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  switch (v["op"]) {
    case "and":
    case "or":
      return Array.isArray(v["conditions"]) && v["conditions"].every((c) => isValidCondition(c, depth + 1));
    case "not":
      return isValidCondition(v["condition"], depth + 1);
    case "exists":
      return typeof v["field"] === "string";
    default:
      return typeof v["op"] === "string" && COMPARISON_OPS.has(v["op"]) && typeof v["field"] === "string" && "value" in v;
  }
}

function isValidAction(value: unknown): boolean {
  if (value === null || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  if (v["kind"] === "enqueue_task") return typeof v["taskType"] === "string" && "payload" in v;
  if (v["kind"] === "publish_event") return typeof v["eventType"] === "string" && "payload" in v;
  return false;
}

function validateCreateInput(body: unknown): { error: string } | { input: CreateRuleInput } {
  if (body === null || typeof body !== "object") return { error: "body must be an object" };
  const b = body as Record<string, unknown>;
  if (typeof b["name"] !== "string" || b["name"].length === 0) return { error: "name is required" };
  if (typeof b["eventPattern"] !== "string" || b["eventPattern"].length === 0) {
    return { error: "eventPattern is required" };
  }
  if (!isValidCondition(b["condition"])) return { error: "condition is missing or malformed" };
  if (!isValidAction(b["action"])) return { error: "action is missing or malformed" };
  if (b["priority"] !== undefined && typeof b["priority"] !== "number") return { error: "priority must be a number" };
  if (b["enabled"] !== undefined && typeof b["enabled"] !== "boolean") return { error: "enabled must be a boolean" };

  const input: CreateRuleInput = {
    name: b["name"],
    eventPattern: b["eventPattern"],
    condition: b["condition"] as Condition,
    action: b["action"] as CreateRuleInput["action"],
  };
  if (typeof b["description"] === "string") input.description = b["description"];
  if (typeof b["priority"] === "number") input.priority = b["priority"];
  if (typeof b["enabled"] === "boolean") input.enabled = b["enabled"];
  return { input };
}

function validateUpdateInput(body: unknown): { error: string } | { input: UpdateRuleInput } {
  if (body === null || typeof body !== "object") return { error: "body must be an object" };
  const b = body as Record<string, unknown>;
  const input: UpdateRuleInput = {};
  if (b["name"] !== undefined) {
    if (typeof b["name"] !== "string" || b["name"].length === 0) return { error: "name must be a non-empty string" };
    input.name = b["name"];
  }
  if (b["description"] !== undefined) {
    if (typeof b["description"] !== "string") return { error: "description must be a string" };
    input.description = b["description"];
  }
  if (b["eventPattern"] !== undefined) {
    if (typeof b["eventPattern"] !== "string" || b["eventPattern"].length === 0) {
      return { error: "eventPattern must be a non-empty string" };
    }
    input.eventPattern = b["eventPattern"];
  }
  if (b["condition"] !== undefined) {
    if (!isValidCondition(b["condition"])) return { error: "condition is malformed" };
    input.condition = b["condition"] as Condition;
  }
  if (b["action"] !== undefined) {
    if (!isValidAction(b["action"])) return { error: "action is malformed" };
    input.action = b["action"] as CreateRuleInput["action"];
  }
  if (b["priority"] !== undefined) {
    if (typeof b["priority"] !== "number") return { error: "priority must be a number" };
    input.priority = b["priority"];
  }
  if (b["enabled"] !== undefined) {
    if (typeof b["enabled"] !== "boolean") return { error: "enabled must be a boolean" };
    input.enabled = b["enabled"];
  }
  return { input };
}

/**
 * Data-defined rules on top of the Brain. Mutating endpoints are admin-only
 * — a rule can make the Brain enqueue tasks or publish events regardless of
 * whose data triggered it, so creating one is a system-wide operation, not
 * a per-user one. Reads are available to any authenticated user so
 * non-admins can see what rules exist without being able to change them.
 */
router.post("/rules", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (req.user!.role !== "admin") {
      res.status(403).json({ error: "Forbidden", message: "Only admins can create rules" });
      return;
    }
    const validated = validateCreateInput(req.body);
    if ("error" in validated) {
      res.status(400).json({ error: "Bad Request", message: validated.error });
      return;
    }
    const rule = await ruleEngine.create({ ...validated.input, userId: req.user!.userId });
    res.status(201).json({ rule });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/rules", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { eventPattern, enabled, limit } = req.query;
    const parsedLimit = typeof limit === "string" ? Number(limit) : undefined;
    const rules = await ruleEngine.list({
      eventPattern: typeof eventPattern === "string" ? eventPattern : undefined,
      enabled: enabled === "true" ? true : enabled === "false" ? false : undefined,
      limit: Number.isFinite(parsedLimit) ? parsedLimit : undefined,
    });
    res.json({ rules });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/rules/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params as { id: string };
    if (!UUID_RE.test(id)) {
      res.status(400).json({ error: "Bad Request", message: "id must be a UUID" });
      return;
    }
    const rule = await ruleEngine.get(id);
    if (!rule) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    res.json({ rule });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/rules/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (req.user!.role !== "admin") {
      res.status(403).json({ error: "Forbidden", message: "Only admins can update rules" });
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
    const rule = await ruleEngine.update(id, validated.input);
    if (!rule) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    res.json({ rule });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/rules/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (req.user!.role !== "admin") {
      res.status(403).json({ error: "Forbidden", message: "Only admins can delete rules" });
      return;
    }
    const { id } = req.params as { id: string };
    if (!UUID_RE.test(id)) {
      res.status(400).json({ error: "Bad Request", message: "id must be a UUID" });
      return;
    }
    const deleted = await ruleEngine.delete(id);
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

router.post("/rules/:id/enable", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (req.user!.role !== "admin") {
      res.status(403).json({ error: "Forbidden", message: "Only admins can enable rules" });
      return;
    }
    const { id } = req.params as { id: string };
    if (!UUID_RE.test(id)) {
      res.status(400).json({ error: "Bad Request", message: "id must be a UUID" });
      return;
    }
    const rule = await ruleEngine.enable(id);
    if (!rule) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    res.json({ rule });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/rules/:id/disable", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (req.user!.role !== "admin") {
      res.status(403).json({ error: "Forbidden", message: "Only admins can disable rules" });
      return;
    }
    const { id } = req.params as { id: string };
    if (!UUID_RE.test(id)) {
      res.status(400).json({ error: "Bad Request", message: "id must be a UUID" });
      return;
    }
    const rule = await ruleEngine.disable(id);
    if (!rule) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    res.json({ rule });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
