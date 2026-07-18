import { Router, type IRouter } from "express";
import { aiProviderManager } from "../lib/ai-provider-manager.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";
import type { CreateProviderInput, ProviderStatus, UpdateProviderInput } from "@workspace/ai-provider-manager";

const router: IRouter = Router();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STATUSES: ProviderStatus[] = ["active", "disabled"];

function validateCreateInput(body: unknown): { error: string } | { input: CreateProviderInput } {
  if (body === null || typeof body !== "object") return { error: "body must be an object" };
  const b = body as Record<string, unknown>;
  if (typeof b["name"] !== "string" || b["name"].length === 0) return { error: "name is required" };
  if (typeof b["providerType"] !== "string" || b["providerType"].length === 0) {
    return { error: "providerType is required" };
  }
  if (typeof b["model"] !== "string" || b["model"].length === 0) return { error: "model is required" };
  if (typeof b["apiKeyEnvVar"] !== "string" || b["apiKeyEnvVar"].length === 0) {
    return { error: "apiKeyEnvVar is required — this must be the NAME of an environment variable, never the key itself" };
  }
  if (b["baseUrl"] !== undefined && typeof b["baseUrl"] !== "string") return { error: "baseUrl must be a string" };
  if (b["isDefault"] !== undefined && typeof b["isDefault"] !== "boolean") return { error: "isDefault must be a boolean" };
  if (b["status"] !== undefined && !STATUSES.includes(b["status"] as ProviderStatus)) {
    return { error: `status must be one of: ${STATUSES.join(", ")}` };
  }

  const input: CreateProviderInput = {
    name: b["name"],
    providerType: b["providerType"],
    model: b["model"],
    apiKeyEnvVar: b["apiKeyEnvVar"],
  };
  if (typeof b["baseUrl"] === "string") input.baseUrl = b["baseUrl"];
  if (typeof b["isDefault"] === "boolean") input.isDefault = b["isDefault"];
  if (typeof b["status"] === "string") input.status = b["status"] as ProviderStatus;
  return { input };
}

function validateUpdateInput(body: unknown): { error: string } | { input: UpdateProviderInput } {
  if (body === null || typeof body !== "object") return { error: "body must be an object" };
  const b = body as Record<string, unknown>;
  const input: UpdateProviderInput = {};
  if (b["name"] !== undefined) {
    if (typeof b["name"] !== "string" || b["name"].length === 0) return { error: "name must be a non-empty string" };
    input.name = b["name"];
  }
  if (b["providerType"] !== undefined) {
    if (typeof b["providerType"] !== "string" || b["providerType"].length === 0) {
      return { error: "providerType must be a non-empty string" };
    }
    input.providerType = b["providerType"];
  }
  if (b["model"] !== undefined) {
    if (typeof b["model"] !== "string" || b["model"].length === 0) return { error: "model must be a non-empty string" };
    input.model = b["model"];
  }
  if (b["apiKeyEnvVar"] !== undefined) {
    if (typeof b["apiKeyEnvVar"] !== "string" || b["apiKeyEnvVar"].length === 0) {
      return { error: "apiKeyEnvVar must be a non-empty string" };
    }
    input.apiKeyEnvVar = b["apiKeyEnvVar"];
  }
  if (b["baseUrl"] !== undefined) {
    if (typeof b["baseUrl"] !== "string") return { error: "baseUrl must be a string" };
    input.baseUrl = b["baseUrl"];
  }
  if (b["isDefault"] !== undefined) {
    if (typeof b["isDefault"] !== "boolean") return { error: "isDefault must be a boolean" };
    input.isDefault = b["isDefault"];
  }
  if (b["status"] !== undefined) {
    if (!STATUSES.includes(b["status"] as ProviderStatus)) return { error: `status must be one of: ${STATUSES.join(", ")}` };
    input.status = b["status"] as ProviderStatus;
  }
  return { input };
}

/**
 * CRUD over AI provider configurations. Admin-only end to end — a provider
 * config references which environment variable holds a shared credential,
 * so it's a system-wide operation, not per-user data. Distinct from the
 * pre-existing `/api/providers*` routes (`routes/providers.ts`), which
 * predate OS Core and manage the legacy per-user provider list with a
 * raw stored `apiKey` — left untouched. This is the new, real one, feeding
 * the Agent Manager's `AgentExecutor`.
 */
router.post("/provider-configs", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (req.user!.role !== "admin") {
      res.status(403).json({ error: "Forbidden", message: "Only admins can create provider configs" });
      return;
    }
    const validated = validateCreateInput(req.body);
    if ("error" in validated) {
      res.status(400).json({ error: "Bad Request", message: validated.error });
      return;
    }
    const config = await aiProviderManager.create({ ...validated.input, userId: req.user!.userId });
    res.status(201).json({ config });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/provider-configs", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { providerType, status, limit } = req.query;
    if (typeof status === "string" && !STATUSES.includes(status as ProviderStatus)) {
      res.status(400).json({ error: "Bad Request", message: `status must be one of: ${STATUSES.join(", ")}` });
      return;
    }
    const parsedLimit = typeof limit === "string" ? Number(limit) : undefined;
    const configs = await aiProviderManager.list({
      providerType: typeof providerType === "string" ? providerType : undefined,
      status: typeof status === "string" ? (status as ProviderStatus) : undefined,
      limit: Number.isFinite(parsedLimit) ? parsedLimit : undefined,
      userId: req.user!.userId,
    });
    res.json({ configs });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/provider-configs/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params as { id: string };
    if (!UUID_RE.test(id)) {
      res.status(400).json({ error: "Bad Request", message: "id must be a UUID" });
      return;
    }
    const config = await aiProviderManager.get(id);
    if (!config) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    res.json({ config });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/provider-configs/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (req.user!.role !== "admin") {
      res.status(403).json({ error: "Forbidden", message: "Only admins can update provider configs" });
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
    const config = await aiProviderManager.update(id, validated.input);
    if (!config) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    res.json({ config });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/provider-configs/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (req.user!.role !== "admin") {
      res.status(403).json({ error: "Forbidden", message: "Only admins can delete provider configs" });
      return;
    }
    const { id } = req.params as { id: string };
    if (!UUID_RE.test(id)) {
      res.status(400).json({ error: "Bad Request", message: "id must be a UUID" });
      return;
    }
    const deleted = await aiProviderManager.delete(id);
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

export default router;
