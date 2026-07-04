import { Router, type IRouter } from "express";
import { toolManager } from "../lib/tool-manager.js";
import {
  ToolDisabledError,
  ToolInputValidationError,
  ToolNotFoundError,
  UnknownToolHandlerError,
} from "@workspace/tool-manager";
import type { CreateToolInput, JsonSchema, ToolStatus, UpdateToolInput } from "@workspace/tool-manager";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";

const router: IRouter = Router();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STATUSES: ToolStatus[] = ["active", "disabled"];
const SCHEMA_TYPES = new Set(["string", "number", "boolean", "object", "array"]);

function isValidJsonSchema(value: unknown, depth = 0): value is JsonSchema {
  if (depth > 10 || value === null || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  if (typeof v["type"] !== "string" || !SCHEMA_TYPES.has(v["type"])) return false;
  if (v["properties"] !== undefined) {
    if (typeof v["properties"] !== "object" || v["properties"] === null) return false;
    for (const propSchema of Object.values(v["properties"] as Record<string, unknown>)) {
      if (!isValidJsonSchema(propSchema, depth + 1)) return false;
    }
  }
  if (v["required"] !== undefined) {
    if (!Array.isArray(v["required"]) || !v["required"].every((r) => typeof r === "string")) return false;
  }
  if (v["items"] !== undefined && !isValidJsonSchema(v["items"], depth + 1)) return false;
  if (v["enum"] !== undefined && !Array.isArray(v["enum"])) return false;
  return true;
}

function validateCreateInput(body: unknown): { error: string } | { input: CreateToolInput } {
  if (body === null || typeof body !== "object") return { error: "body must be an object" };
  const b = body as Record<string, unknown>;
  if (typeof b["name"] !== "string" || b["name"].length === 0) return { error: "name is required" };
  if (typeof b["description"] !== "string" || b["description"].length === 0) {
    return { error: "description is required" };
  }
  if (!isValidJsonSchema(b["inputSchema"])) return { error: "inputSchema is missing or malformed" };
  if (typeof b["handlerName"] !== "string" || b["handlerName"].length === 0) {
    return { error: "handlerName is required" };
  }
  if (b["status"] !== undefined && !STATUSES.includes(b["status"] as ToolStatus)) {
    return { error: `status must be one of: ${STATUSES.join(", ")}` };
  }

  const input: CreateToolInput = {
    name: b["name"],
    description: b["description"],
    inputSchema: b["inputSchema"] as JsonSchema,
    handlerName: b["handlerName"],
  };
  if (typeof b["status"] === "string") input.status = b["status"] as ToolStatus;
  return { input };
}

function validateUpdateInput(body: unknown): { error: string } | { input: UpdateToolInput } {
  if (body === null || typeof body !== "object") return { error: "body must be an object" };
  const b = body as Record<string, unknown>;
  const input: UpdateToolInput = {};
  if (b["name"] !== undefined) {
    if (typeof b["name"] !== "string" || b["name"].length === 0) return { error: "name must be a non-empty string" };
    input.name = b["name"];
  }
  if (b["description"] !== undefined) {
    if (typeof b["description"] !== "string" || b["description"].length === 0) {
      return { error: "description must be a non-empty string" };
    }
    input.description = b["description"];
  }
  if (b["inputSchema"] !== undefined) {
    if (!isValidJsonSchema(b["inputSchema"])) return { error: "inputSchema is malformed" };
    input.inputSchema = b["inputSchema"] as JsonSchema;
  }
  if (b["handlerName"] !== undefined) {
    if (typeof b["handlerName"] !== "string" || b["handlerName"].length === 0) {
      return { error: "handlerName must be a non-empty string" };
    }
    input.handlerName = b["handlerName"];
  }
  if (b["status"] !== undefined) {
    if (!STATUSES.includes(b["status"] as ToolStatus)) return { error: `status must be one of: ${STATUSES.join(", ")}` };
    input.status = b["status"] as ToolStatus;
  }
  return { input };
}

/**
 * Tool registration, lifecycle, and invocation. Mutating endpoints are
 * admin-only — a tool's `handlerName` determines what code runs when it's
 * invoked, so registering one is a system-wide operation. Reads and invoke
 * are open to any authenticated user, same rationale as agents: using an
 * existing, enabled tool is the normal day-to-day path.
 */
router.post("/tools", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (req.user!.role !== "admin") {
      res.status(403).json({ error: "Forbidden", message: "Only admins can register tools" });
      return;
    }
    const validated = validateCreateInput(req.body);
    if ("error" in validated) {
      res.status(400).json({ error: "Bad Request", message: validated.error });
      return;
    }
    const tool = await toolManager.create({ ...validated.input, userId: req.user!.userId });
    res.status(201).json({ tool });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/tools", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { status, handlerName, limit } = req.query;
    if (typeof status === "string" && !STATUSES.includes(status as ToolStatus)) {
      res.status(400).json({ error: "Bad Request", message: `status must be one of: ${STATUSES.join(", ")}` });
      return;
    }
    const parsedLimit = typeof limit === "string" ? Number(limit) : undefined;
    const tools = await toolManager.list({
      status: typeof status === "string" ? (status as ToolStatus) : undefined,
      handlerName: typeof handlerName === "string" ? handlerName : undefined,
      limit: Number.isFinite(parsedLimit) ? parsedLimit : undefined,
    });
    res.json({ tools });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/tools/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params as { id: string };
    if (!UUID_RE.test(id)) {
      res.status(400).json({ error: "Bad Request", message: "id must be a UUID" });
      return;
    }
    const tool = await toolManager.get(id);
    if (!tool) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    res.json({ tool });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/tools/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (req.user!.role !== "admin") {
      res.status(403).json({ error: "Forbidden", message: "Only admins can update tools" });
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
    const tool = await toolManager.update(id, validated.input);
    if (!tool) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    res.json({ tool });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/tools/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (req.user!.role !== "admin") {
      res.status(403).json({ error: "Forbidden", message: "Only admins can delete tools" });
      return;
    }
    const { id } = req.params as { id: string };
    if (!UUID_RE.test(id)) {
      res.status(400).json({ error: "Bad Request", message: "id must be a UUID" });
      return;
    }
    const deleted = await toolManager.delete(id);
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

router.post("/tools/:id/enable", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (req.user!.role !== "admin") {
      res.status(403).json({ error: "Forbidden", message: "Only admins can enable tools" });
      return;
    }
    const { id } = req.params as { id: string };
    if (!UUID_RE.test(id)) {
      res.status(400).json({ error: "Bad Request", message: "id must be a UUID" });
      return;
    }
    const tool = await toolManager.enable(id);
    if (!tool) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    res.json({ tool });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/tools/:id/disable", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (req.user!.role !== "admin") {
      res.status(403).json({ error: "Forbidden", message: "Only admins can disable tools" });
      return;
    }
    const { id } = req.params as { id: string };
    if (!UUID_RE.test(id)) {
      res.status(400).json({ error: "Bad Request", message: "id must be a UUID" });
      return;
    }
    const tool = await toolManager.disable(id);
    if (!tool) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    res.json({ tool });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/tools/:name/invoke", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { name } = req.params as { name: string };
    const output = await toolManager.invoke(name, req.body ?? {}, req.user!.userId);
    res.status(200).json({ output });
  } catch (err) {
    if (err instanceof ToolNotFoundError) {
      res.status(404).json({ error: "Not Found", message: err.message });
      return;
    }
    if (err instanceof ToolDisabledError) {
      res.status(409).json({ error: "Conflict", message: err.message });
      return;
    }
    if (err instanceof ToolInputValidationError) {
      res.status(400).json({ error: "Bad Request", message: err.message, details: err.errors });
      return;
    }
    if (err instanceof UnknownToolHandlerError) {
      res.status(501).json({ error: "Not Implemented", message: err.message });
      return;
    }
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
