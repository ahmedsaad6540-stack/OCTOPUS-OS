import { Router, type IRouter } from "express";
import { scheduler } from "../lib/scheduler.js";
import { parseCronExpression } from "@workspace/scheduler";
import type {
  CreateScheduledJobInput,
  ScheduledJobStatus,
  ScheduledJobTarget,
  ScheduleSpec,
  UpdateScheduledJobInput,
} from "@workspace/scheduler";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";

const router: IRouter = Router();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STATUSES: ScheduledJobStatus[] = ["active", "disabled"];

function isValidSchedule(value: unknown): { error: string } | { schedule: ScheduleSpec } {
  if (value === null || typeof value !== "object") return { error: "schedule must be an object" };
  const v = value as Record<string, unknown>;
  if (v["type"] === "interval") {
    if (typeof v["intervalMs"] !== "number" || v["intervalMs"] <= 0) {
      return { error: "schedule.intervalMs must be a positive number" };
    }
    return { schedule: { type: "interval", intervalMs: v["intervalMs"] } };
  }
  if (v["type"] === "cron") {
    if (typeof v["expression"] !== "string") return { error: "schedule.expression must be a string" };
    try {
      parseCronExpression(v["expression"]);
    } catch (err) {
      return { error: `schedule.expression is invalid: ${err instanceof Error ? err.message : String(err)}` };
    }
    return { schedule: { type: "cron", expression: v["expression"] } };
  }
  return { error: 'schedule.type must be "interval" or "cron"' };
}

function isValidTarget(value: unknown): { error: string } | { target: ScheduledJobTarget } {
  if (value === null || typeof value !== "object") return { error: "target must be an object" };
  const v = value as Record<string, unknown>;
  if (v["type"] === "workflow") {
    if (typeof v["workflowId"] !== "string") return { error: "target.workflowId must be a string" };
    return { target: { type: "workflow", workflowId: v["workflowId"], input: v["input"] } };
  }
  if (v["type"] === "task") {
    if (typeof v["taskType"] !== "string") return { error: "target.taskType must be a string" };
    if (!("payload" in v)) return { error: "target.payload is required" };
    const target: ScheduledJobTarget = { type: "task", taskType: v["taskType"], payload: v["payload"] };
    if (typeof v["queue"] === "string") target.queue = v["queue"];
    if (typeof v["priority"] === "number") target.priority = v["priority"];
    if (typeof v["maxAttempts"] === "number") target.maxAttempts = v["maxAttempts"];
    return { target };
  }
  return { error: 'target.type must be "workflow" or "task"' };
}

function validateCreateInput(body: unknown): { error: string } | { input: CreateScheduledJobInput } {
  if (body === null || typeof body !== "object") return { error: "body must be an object" };
  const b = body as Record<string, unknown>;
  if (typeof b["name"] !== "string" || b["name"].length === 0) return { error: "name is required" };

  const schedule = isValidSchedule(b["schedule"]);
  if ("error" in schedule) return schedule;
  const target = isValidTarget(b["target"]);
  if ("error" in target) return target;

  if (b["status"] !== undefined && !STATUSES.includes(b["status"] as ScheduledJobStatus)) {
    return { error: `status must be one of: ${STATUSES.join(", ")}` };
  }

  const input: CreateScheduledJobInput = { name: b["name"], schedule: schedule.schedule, target: target.target };
  if (typeof b["description"] === "string") input.description = b["description"];
  if (typeof b["status"] === "string") input.status = b["status"] as ScheduledJobStatus;
  return { input };
}

function validateUpdateInput(body: unknown): { error: string } | { input: UpdateScheduledJobInput } {
  if (body === null || typeof body !== "object") return { error: "body must be an object" };
  const b = body as Record<string, unknown>;
  const input: UpdateScheduledJobInput = {};
  if (b["name"] !== undefined) {
    if (typeof b["name"] !== "string" || b["name"].length === 0) return { error: "name must be a non-empty string" };
    input.name = b["name"];
  }
  if (b["description"] !== undefined) {
    if (typeof b["description"] !== "string") return { error: "description must be a string" };
    input.description = b["description"];
  }
  if (b["schedule"] !== undefined) {
    const schedule = isValidSchedule(b["schedule"]);
    if ("error" in schedule) return schedule;
    input.schedule = schedule.schedule;
  }
  if (b["target"] !== undefined) {
    const target = isValidTarget(b["target"]);
    if ("error" in target) return target;
    input.target = target.target;
  }
  if (b["status"] !== undefined) {
    if (!STATUSES.includes(b["status"] as ScheduledJobStatus)) return { error: `status must be one of: ${STATUSES.join(", ")}` };
    input.status = b["status"] as ScheduledJobStatus;
  }
  return { input };
}

/**
 * Scheduled job registration, lifecycle, and run history. Admin-only end to
 * end — a job fires on its own timer regardless of who's looking, so it's
 * a system-wide operation with no natural "owner reads their own" split
 * the way agents/tools/workflows have via their invoke endpoints.
 */
router.post("/scheduled-jobs", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (req.user!.role !== "admin") {
      res.status(403).json({ error: "Forbidden", message: "Only admins can create scheduled jobs" });
      return;
    }
    const validated = validateCreateInput(req.body);
    if ("error" in validated) {
      res.status(400).json({ error: "Bad Request", message: validated.error });
      return;
    }
    const job = await scheduler.create({ ...validated.input, userId: req.user!.userId });
    res.status(201).json({ job });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/scheduled-jobs", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (req.user!.role !== "admin") {
      res.status(403).json({ error: "Forbidden", message: "Only admins can view scheduled jobs" });
      return;
    }
    const { status, limit } = req.query;
    if (typeof status === "string" && !STATUSES.includes(status as ScheduledJobStatus)) {
      res.status(400).json({ error: "Bad Request", message: `status must be one of: ${STATUSES.join(", ")}` });
      return;
    }
    const parsedLimit = typeof limit === "string" ? Number(limit) : undefined;
    const jobs = await scheduler.list({
      status: typeof status === "string" ? (status as ScheduledJobStatus) : undefined,
      limit: Number.isFinite(parsedLimit) ? parsedLimit : undefined,
    });
    res.json({ jobs });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/scheduled-jobs/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (req.user!.role !== "admin") {
      res.status(403).json({ error: "Forbidden", message: "Only admins can view scheduled jobs" });
      return;
    }
    const { id } = req.params as { id: string };
    if (!UUID_RE.test(id)) {
      res.status(400).json({ error: "Bad Request", message: "id must be a UUID" });
      return;
    }
    const job = await scheduler.get(id);
    if (!job) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    res.json({ job });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/scheduled-jobs/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (req.user!.role !== "admin") {
      res.status(403).json({ error: "Forbidden", message: "Only admins can update scheduled jobs" });
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
    const job = await scheduler.update(id, validated.input);
    if (!job) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    res.json({ job });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/scheduled-jobs/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (req.user!.role !== "admin") {
      res.status(403).json({ error: "Forbidden", message: "Only admins can delete scheduled jobs" });
      return;
    }
    const { id } = req.params as { id: string };
    if (!UUID_RE.test(id)) {
      res.status(400).json({ error: "Bad Request", message: "id must be a UUID" });
      return;
    }
    const deleted = await scheduler.delete(id);
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

router.post("/scheduled-jobs/:id/enable", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (req.user!.role !== "admin") {
      res.status(403).json({ error: "Forbidden", message: "Only admins can enable scheduled jobs" });
      return;
    }
    const { id } = req.params as { id: string };
    if (!UUID_RE.test(id)) {
      res.status(400).json({ error: "Bad Request", message: "id must be a UUID" });
      return;
    }
    const job = await scheduler.enable(id);
    if (!job) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    res.json({ job });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/scheduled-jobs/:id/disable", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (req.user!.role !== "admin") {
      res.status(403).json({ error: "Forbidden", message: "Only admins can disable scheduled jobs" });
      return;
    }
    const { id } = req.params as { id: string };
    if (!UUID_RE.test(id)) {
      res.status(400).json({ error: "Bad Request", message: "id must be a UUID" });
      return;
    }
    const job = await scheduler.disable(id);
    if (!job) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    res.json({ job });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/scheduled-jobs/:id/runs", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (req.user!.role !== "admin") {
      res.status(403).json({ error: "Forbidden", message: "Only admins can view scheduled job runs" });
      return;
    }
    const { id } = req.params as { id: string };
    if (!UUID_RE.test(id)) {
      res.status(400).json({ error: "Bad Request", message: "id must be a UUID" });
      return;
    }
    const { limit } = req.query;
    const parsedLimit = typeof limit === "string" ? Number(limit) : undefined;
    const runs = await scheduler.listRuns({
      jobId: id,
      limit: Number.isFinite(parsedLimit) ? parsedLimit : undefined,
    });
    res.json({ runs });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
