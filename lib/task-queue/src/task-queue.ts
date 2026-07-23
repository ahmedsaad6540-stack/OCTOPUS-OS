import { randomUUID } from "node:crypto";
import type {
  ClaimOptions,
  EnqueueOptions,
  EventPublisher,
  FailOptions,
  OctopusTask,
  TaskListQuery,
  TaskStore,
} from "./types.js";

export interface TaskQueueLogger {
  debug(obj: Record<string, unknown>, msg?: string): void;
  info(obj: Record<string, unknown>, msg?: string): void;
  warn(obj: Record<string, unknown>, msg?: string): void;
  error(obj: Record<string, unknown>, msg?: string): void;
}

const noopLogger: TaskQueueLogger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};

const DEFAULT_QUEUE = "default";
const DEFAULT_MAX_ATTEMPTS = 3;
const RETRY_BASE_MS = 30_000; // 30s
const RETRY_CAP_MS = 60 * 60_000; // 1h
const DEFAULT_STALE_LOCK_MS = 5 * 60_000; // 5m

/**
 * OS Core's Task Manager + Queue Manager, built directly on the Event Bus's
 * durable-by-design substrate (see `replit.md`).
 *
 * Task Manager responsibilities: create/track/query the full lifecycle of a
 * unit of work (`enqueue`, `get`, `list`, `cancel`).
 *
 * Queue Manager responsibilities: hand tasks out to workers safely across
 * processes and recover from failure (`claim`, `complete`, `fail`,
 * `reclaimStale`) — the "cross-process/durable redelivery" substrate
 * `replit.md` describes as upcoming.
 *
 * Platform-independent by construction: this class depends only on
 * `TaskStore` and `EventBus`, never on Express, a runtime, or a specific
 * client. Any client — web, mobile, desktop, a future API client, or a
 * future AI agent — interacts with tasks exclusively through published
 * events and whatever thin adapter (e.g. `artifacts/api-server`'s REST
 * routes) exposes this class's methods, exactly like `EventBus` itself.
 * Modules and agents never reach into `TaskStore` directly, and never call
 * each other directly to hand off work — every handoff is enqueuing a task
 * here, and every outcome is a published event.
 */
export class TaskQueue {
  constructor(
    private readonly store: TaskStore,
    private readonly eventBus: EventPublisher,
    private readonly logger: TaskQueueLogger = noopLogger,
  ) {}

  /** Task Manager: create a new task and publish `task.created`. */
  async enqueue<TPayload>(
    type: string,
    source: string,
    payload: TPayload,
    options: EnqueueOptions = {},
  ): Promise<OctopusTask> {
    const now = new Date();
    const availableAt = options.availableAt
      ? new Date(options.availableAt)
      : new Date(now.getTime() + (options.delayMs ?? 0));

    const correlationId = options.correlationId ?? randomUUID();

    const task: OctopusTask = {
      id: randomUUID(),
      type,
      queue: options.queue ?? DEFAULT_QUEUE,
      status: "queued",
      priority: options.priority ?? 0,
      payload,
      result: null,
      error: null,
      attempts: 0,
      maxAttempts: options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS,
      availableAt: availableAt.toISOString(),
      lockedBy: null,
      lockedAt: null,
      startedAt: null,
      completedAt: null,
      source,
      correlationId,
      ...(options.causationId ? { causationId: options.causationId } : {}),
      ...(options.userId ? { userId: options.userId } : {}),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    const created = await this.store.insert(task);

    await this.eventBus.publish("task.created", source, created, {
      correlationId,
      ...(options.causationId ? { causationId: options.causationId } : {}),
      ...(options.userId ? { userId: options.userId } : {}),
    });

    this.logger.info(
      { taskId: created.id, type: created.type, queue: created.queue },
      "task.enqueued",
    );

    return created;
  }

  /** Task Manager: fetch a single task by id. */
  async get(taskId: string): Promise<OctopusTask | null> {
    return this.store.getById(taskId);
  }

  /** Task Manager: query tasks by status/type/queue/owner. */
  async list(query: TaskListQuery = {}): Promise<OctopusTask[]> {
    return this.store.list(query);
  }

  /**
   * Task Manager: cancel a queued or running task. No-op (returns null) if
   * the task is already in a terminal state or doesn't exist.
   */
  async cancel(taskId: string, source: string): Promise<OctopusTask | null> {
    const cancelled = await this.store.cancel(taskId, new Date());
    if (!cancelled) return null;

    await this.eventBus.publish("task.cancelled", source, cancelled, {
      correlationId: cancelled.correlationId,
      ...(cancelled.userId ? { userId: cancelled.userId } : {}),
    });

    this.logger.info({ taskId }, "task.cancelled");
    return cancelled;
  }

  /**
   * Queue Manager: atomically claim the next eligible task from `queue` for
   * `workerId`, or return null if none are eligible right now. Publishes
   * `task.started`. Safe to call concurrently from multiple worker
   * processes — see `TaskStore.claimNext`.
   */
  async claim(workerId: string, options: ClaimOptions = {}): Promise<OctopusTask | null> {
    const queue = options.queue ?? DEFAULT_QUEUE;
    const claimed = await this.store.claimNext(queue, workerId, new Date());
    if (!claimed) return null;

    await this.eventBus.publish("task.started", `worker:${workerId}`, claimed, {
      correlationId: claimed.correlationId,
      ...(claimed.userId ? { userId: claimed.userId } : {}),
    });

    this.logger.info({ taskId: claimed.id, workerId, queue }, "task.claimed");
    return claimed;
  }

  /** Queue Manager: mark a claimed task successfully completed. */
  async complete(taskId: string, workerId: string, result: unknown): Promise<OctopusTask | null> {
    const completed = await this.store.markCompleted(taskId, result, new Date());
    if (!completed) return null;

    await this.eventBus.publish("task.completed", `worker:${workerId}`, completed, {
      correlationId: completed.correlationId,
      ...(completed.userId ? { userId: completed.userId } : {}),
    });

    this.logger.info({ taskId, workerId }, "task.completed");
    return completed;
  }

  /**
   * Queue Manager: report a claimed task as failed. If retries remain (and
   * `options.retry` isn't `false`), reschedules it with exponential backoff
   * and publishes `task.retrying`; otherwise marks it permanently `failed`
   * and publishes `task.failed`.
   */
  async fail(
    taskId: string,
    workerId: string,
    error: string,
    options: FailOptions = {},
  ): Promise<OctopusTask | null> {
    const now = new Date();
    const task = await this.store.getById(taskId);
    if (!task) return null;

    const shouldRetry = (options.retry ?? true) && task.attempts < task.maxAttempts;

    if (shouldRetry) {
      const backoffMs = Math.min(RETRY_CAP_MS, RETRY_BASE_MS * 2 ** (task.attempts - 1));
      const availableAt = new Date(now.getTime() + backoffMs);
      const retried = await this.store.scheduleRetry(taskId, error, availableAt, now);
      if (!retried) return null;

      await this.eventBus.publish("task.retrying", `worker:${workerId}`, retried, {
        correlationId: retried.correlationId,
        ...(retried.userId ? { userId: retried.userId } : {}),
      });

      this.logger.warn(
        { taskId, workerId, attempt: task.attempts, backoffMs },
        "task.retry_scheduled",
      );
      return retried;
    }

    const failed = await this.store.markFailedPermanently(taskId, error, now);
    if (!failed) return null;

    await this.eventBus.publish("task.failed", `worker:${workerId}`, failed, {
      correlationId: failed.correlationId,
      ...(failed.userId ? { userId: failed.userId } : {}),
    });

    this.logger.error({ taskId, workerId, error }, "task.failed");
    return failed;
  }

  /**
   * Queue Manager: requeue tasks left `running` by workers that crashed or
   * were killed mid-task (lock older than `staleAfterMs`). Publishes
   * `task.reclaimed` for each. Intended to be called periodically by a
   * supervisor process, not per-request.
   */
  async reclaimStale(staleAfterMs: number = DEFAULT_STALE_LOCK_MS): Promise<OctopusTask[]> {
    const now = new Date();
    const olderThan = new Date(now.getTime() - staleAfterMs);
    const reclaimed = await this.store.reclaimStale(olderThan, now);

    for (const task of reclaimed) {
      await this.eventBus.publish("task.reclaimed", "os-core:task-queue", task, {
        correlationId: task.correlationId,
        ...(task.userId ? { userId: task.userId } : {}),
      });
    }

    if (reclaimed.length > 0) {
      this.logger.warn({ count: reclaimed.length, staleAfterMs }, "task.stale_reclaimed");
    }

    return reclaimed;
  }
}
