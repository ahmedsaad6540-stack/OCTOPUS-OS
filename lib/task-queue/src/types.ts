export const taskStatusValues = [
  "queued",
  "running",
  "completed",
  "failed",
  "cancelled",
] as const;
export type TaskStatus = (typeof taskStatusValues)[number];

/**
 * A unit of work tracked by the Task Manager. This is the shape every
 * client (web, mobile, desktop, future API clients, future AI agents) and
 * every OS Core module sees — none of them ever touch the storage layer
 * directly.
 */
export interface OctopusTask<TPayload = unknown, TResult = unknown> {
  id: string;
  type: string;
  queue: string;
  status: TaskStatus;
  priority: number;
  payload: TPayload;
  result: TResult | null;
  error: string | null;
  attempts: number;
  maxAttempts: number;
  availableAt: string;
  lockedBy: string | null;
  lockedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  source: string;
  correlationId: string;
  causationId?: string;
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EnqueueOptions {
  queue?: string;
  priority?: number;
  maxAttempts?: number;
  /** Delay before the task becomes claimable. Mutually exclusive with `availableAt`. */
  delayMs?: number;
  /** Absolute claimable time (ISO 8601). Mutually exclusive with `delayMs`. */
  availableAt?: string;
  correlationId?: string;
  causationId?: string;
  userId?: string;
}

export interface ClaimOptions {
  queue?: string;
}

export interface FailOptions {
  /**
   * Whether this failure should be retried (subject to maxAttempts). Defaults
   * to true — callers doing a permanent/non-retryable failure should pass
   * `retry: false` to fail the task immediately regardless of attempts left.
   */
  retry?: boolean;
}

export interface TaskListQuery {
  status?: TaskStatus;
  type?: string;
  queue?: string;
  userId?: string;
  correlationId?: string;
  limit?: number;
}

/**
 * The minimal event-publishing capability the Task/Queue Manager depends
 * on. `@workspace/event-bus`'s `EventBus` class satisfies this structurally
 * — production code passes a real `EventBus` instance — but `TaskQueue`
 * itself has no compile-time or runtime dependency on that package. This
 * keeps the Task/Queue Manager honestly platform- and package-independent
 * (matching `replit.md`'s "no direct imports between agent/module
 * implementations" constraint) and lets it be unit-tested with a plain
 * in-memory publisher.
 */
export interface EventPublisher {
  publish<TPayload>(
    type: string,
    source: string,
    payload: TPayload,
    options?: {
      correlationId?: string;
      causationId?: string;
      userId?: string;
      version?: number;
    },
  ): Promise<unknown>;
}

/**
 * Persistence boundary for the Task/Queue Manager. Swappable so the same
 * `TaskQueue` logic runs against Postgres in production and against an
 * in-memory store in tests, without either the manager or its callers
 * changing — mirrors `EventStore` in `@workspace/event-bus`.
 */
export interface TaskStore {
  insert(task: OctopusTask): Promise<OctopusTask>;
  getById(taskId: string): Promise<OctopusTask | null>;
  list(query: TaskListQuery): Promise<OctopusTask[]>;

  /**
   * Atomically claim the next eligible queued task for `workerId` and mark
   * it running, or return null if none are eligible. Must be safe under
   * concurrent callers: two simultaneous claims must never return the same
   * task.
   */
  claimNext(queue: string, workerId: string, now: Date): Promise<OctopusTask | null>;

  markCompleted(taskId: string, result: unknown, now: Date): Promise<OctopusTask | null>;

  markFailedPermanently(taskId: string, error: string, now: Date): Promise<OctopusTask | null>;

  /** Schedules a retry: back to `queued`, attempt lock released, availableAt bumped. */
  scheduleRetry(
    taskId: string,
    error: string,
    availableAt: Date,
    now: Date,
  ): Promise<OctopusTask | null>;

  /** Cancels a task if it is still queued or running. No-op (returns null) otherwise. */
  cancel(taskId: string, now: Date): Promise<OctopusTask | null>;

  /**
   * Requeues tasks stuck in `running` whose lock is older than `olderThan`
   * — recovery for workers that crashed or were killed mid-task. Returns
   * the requeued tasks.
   */
  reclaimStale(olderThan: Date, now: Date): Promise<OctopusTask[]>;
}
