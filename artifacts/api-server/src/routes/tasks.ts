import { Router, type IRouter } from "express";
import { taskStatusValues, type TaskStatus } from "@workspace/task-queue";
import { taskQueue } from "../lib/task-queue.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";

const router: IRouter = Router();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TASK_TYPE_RE = /^[a-z0-9]+(\.[a-z0-9-]+)*$/i;

function isTaskStatus(value: unknown): value is TaskStatus {
  return typeof value === "string" && (taskStatusValues as readonly string[]).includes(value);
}

/**
 * OS Core's Task Manager + Queue Manager, exposed over HTTP. This is the
 * one surface any client — web, mobile, desktop, a future API client, or a
 * future AI agent acting as a worker — uses to enqueue work and (for
 * workers) claim/complete/fail it. None of them ever reach into
 * `@workspace/task-queue`'s storage layer or the `tasks` table directly.
 *
 * Request validation here is hand-rolled rather than generated from
 * `lib/api-spec/openapi.yaml`, for the same reason `system-events.ts` is:
 * `pnpm --filter @workspace/api-spec run codegen` needs to be re-run in an
 * environment with network access before `@workspace/api-zod` picks up the
 * `/tasks` schemas added to the spec. See `replit.md` Gotchas.
 */

router.post("/tasks", requireAuth, async (req: AuthRequest, res) => {
  try {
    const body = req.body as {
      type?: unknown;
      payload?: unknown;
      queue?: unknown;
      priority?: unknown;
      maxAttempts?: unknown;
      delayMs?: unknown;
      correlationId?: unknown;
    };

    if (typeof body.type !== "string" || body.type.length === 0) {
      res.status(400).json({ error: "Bad Request", message: "type is required" });
      return;
    }
    if (!TASK_TYPE_RE.test(body.type)) {
      res.status(400).json({
        error: "Bad Request",
        message: "type must be dot-namespaced, e.g. \"campaign.publish\"",
      });
      return;
    }
    if (body.payload === undefined) {
      res.status(400).json({ error: "Bad Request", message: "payload is required" });
      return;
    }
    if (body.queue !== undefined && typeof body.queue !== "string") {
      res.status(400).json({ error: "Bad Request", message: "queue must be a string" });
      return;
    }
    if (body.priority !== undefined && typeof body.priority !== "number") {
      res.status(400).json({ error: "Bad Request", message: "priority must be a number" });
      return;
    }
    if (
      body.maxAttempts !== undefined &&
      (typeof body.maxAttempts !== "number" || body.maxAttempts < 1)
    ) {
      res
        .status(400)
        .json({ error: "Bad Request", message: "maxAttempts must be a positive number" });
      return;
    }
    if (body.delayMs !== undefined && (typeof body.delayMs !== "number" || body.delayMs < 0)) {
      res.status(400).json({ error: "Bad Request", message: "delayMs must be a non-negative number" });
      return;
    }
    if (body.correlationId !== undefined) {
      if (typeof body.correlationId !== "string" || !UUID_RE.test(body.correlationId)) {
        res.status(400).json({ error: "Bad Request", message: "correlationId must be a UUID" });
        return;
      }
    }

    const task = await taskQueue.enqueue(body.type, "api-server", body.payload, {
      ...(body.queue !== undefined ? { queue: body.queue as string } : {}),
      ...(body.priority !== undefined ? { priority: body.priority as number } : {}),
      ...(body.maxAttempts !== undefined ? { maxAttempts: body.maxAttempts as number } : {}),
      ...(body.delayMs !== undefined ? { delayMs: body.delayMs as number } : {}),
      ...(body.correlationId !== undefined ? { correlationId: body.correlationId as string } : {}),
      userId: req.user!.userId,
    });

    res.status(201).json({ task });
  } catch (err) {
    req.log.error(err, "Create task error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/tasks", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { status, type, queue, correlationId, limit } = req.query;

    if (status !== undefined && !isTaskStatus(status)) {
      res.status(400).json({
        error: "Bad Request",
        message: `status must be one of: ${taskStatusValues.join(", ")}`,
      });
      return;
    }
    if (typeof correlationId === "string" && !UUID_RE.test(correlationId)) {
      res.status(400).json({ error: "Bad Request", message: "correlationId must be a UUID" });
      return;
    }

    const isAdmin = req.user!.role === "admin";
    const parsedLimit = typeof limit === "string" ? Number(limit) : undefined;

    const tasks = await taskQueue.list({
      ...(typeof status === "string" ? { status: status as TaskStatus } : {}),
      ...(typeof type === "string" ? { type } : {}),
      ...(typeof queue === "string" ? { queue } : {}),
      ...(typeof correlationId === "string" ? { correlationId } : {}),
      ...(Number.isFinite(parsedLimit) ? { limit: parsedLimit } : {}),
      // Non-admins only ever see their own tasks, mirroring /system/events.
      ...(isAdmin ? {} : { userId: req.user!.userId }),
    });

    res.json({ tasks });
  } catch (err) {
    req.log.error(err, "List tasks error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/tasks/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params as { id: string };
    if (!UUID_RE.test(id)) {
      res.status(400).json({ error: "Bad Request", message: "id must be a UUID" });
      return;
    }

    const task = await taskQueue.get(id);
    if (!task) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    const isAdmin = req.user!.role === "admin";
    if (!isAdmin && task.userId !== req.user!.userId) {
      res.status(404).json({ error: "Not Found" });
      return;
    }

    res.json({ task });
  } catch (err) {
    req.log.error(err, "Get task error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/tasks/:id/cancel", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params as { id: string };
    if (!UUID_RE.test(id)) {
      res.status(400).json({ error: "Bad Request", message: "id must be a UUID" });
      return;
    }

    const existing = await taskQueue.get(id);
    if (!existing) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    const isAdmin = req.user!.role === "admin";
    if (!isAdmin && existing.userId !== req.user!.userId) {
      res.status(404).json({ error: "Not Found" });
      return;
    }

    const cancelled = await taskQueue.cancel(id, "api-server");
    if (!cancelled) {
      res.status(409).json({
        error: "Conflict",
        message: "Task is already in a terminal state and cannot be cancelled",
      });
      return;
    }

    res.json({ task: cancelled });
  } catch (err) {
    req.log.error(err, "Cancel task error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * Worker-facing endpoints below. Any authenticated client may act as a
 * worker today — there is no separate service-credential scheme yet (see
 * replit.md Gotchas) — so these are gated the same as every other route
 * via `requireAuth`.
 */

router.post("/tasks/claim", requireAuth, async (req: AuthRequest, res) => {
  try {
    const body = req.body as { queue?: unknown };
    if (body.queue !== undefined && typeof body.queue !== "string") {
      res.status(400).json({ error: "Bad Request", message: "queue must be a string" });
      return;
    }

    const task = await taskQueue.claim(req.user!.userId, {
      ...(body.queue !== undefined ? { queue: body.queue as string } : {}),
    });

    if (!task) {
      res.status(204).send();
      return;
    }

    res.json({ task });
  } catch (err) {
    req.log.error(err, "Claim task error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/tasks/:id/complete", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params as { id: string };
    if (!UUID_RE.test(id)) {
      res.status(400).json({ error: "Bad Request", message: "id must be a UUID" });
      return;
    }

    const existing = await taskQueue.get(id);
    if (!existing) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    if (existing.status !== "running" || existing.lockedBy !== req.user!.userId) {
      res.status(409).json({
        error: "Conflict",
        message: "Task is not currently claimed by this worker",
      });
      return;
    }

    const body = req.body as { result?: unknown };
    const completed = await taskQueue.complete(id, req.user!.userId, body.result ?? null);
    if (!completed) {
      res.status(404).json({ error: "Not Found" });
      return;
    }

    res.json({ task: completed });
  } catch (err) {
    req.log.error(err, "Complete task error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/tasks/:id/fail", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params as { id: string };
    if (!UUID_RE.test(id)) {
      res.status(400).json({ error: "Bad Request", message: "id must be a UUID" });
      return;
    }

    const existing = await taskQueue.get(id);
    if (!existing) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    if (existing.status !== "running" || existing.lockedBy !== req.user!.userId) {
      res.status(409).json({
        error: "Conflict",
        message: "Task is not currently claimed by this worker",
      });
      return;
    }

    const body = req.body as { error?: unknown; retry?: unknown };
    if (typeof body.error !== "string" || body.error.length === 0) {
      res.status(400).json({ error: "Bad Request", message: "error is required" });
      return;
    }
    if (body.retry !== undefined && typeof body.retry !== "boolean") {
      res.status(400).json({ error: "Bad Request", message: "retry must be a boolean" });
      return;
    }

    const failed = await taskQueue.fail(id, req.user!.userId, body.error, {
      ...(body.retry !== undefined ? { retry: body.retry as boolean } : {}),
    });
    if (!failed) {
      res.status(404).json({ error: "Not Found" });
      return;
    }

    res.json({ task: failed });
  } catch (err) {
    req.log.error(err, "Fail task error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
