/**
 * The Scheduler triggers a workflow run or a task enqueue on a cron
 * expression or fixed interval. It never reimplements either — `target`
 * dispatches through `WorkflowRunner`/`TaskEnqueuer`, decoupled interfaces
 * mirroring `WorkflowEngine.run`/`TaskQueue.enqueue` exactly, the same
 * pattern every OS Core module before this one uses. `tick()` is the one
 * place scheduling logic lives; `start()`/`stop()` just wrap it in a timer
 * for production use, and both are pure enough to unit-test without real
 * timers (`now` is injectable, `tick()` can be called directly).
 */

// ---------------------------------------------------------------------------
// Schedule specification
// ---------------------------------------------------------------------------

export type ScheduleSpec = { type: "cron"; expression: string } | { type: "interval"; intervalMs: number };

// ---------------------------------------------------------------------------
// Job target
// ---------------------------------------------------------------------------

export type ScheduledJobTarget =
  | { type: "workflow"; workflowId: string; input: unknown }
  | {
      type: "task";
      taskType: string;
      payload: unknown;
      queue?: string;
      priority?: number;
      maxAttempts?: number;
    };

// ---------------------------------------------------------------------------
// Scheduled job (durable)
// ---------------------------------------------------------------------------

export type ScheduledJobStatus = "active" | "disabled";

export interface ScheduledJob {
  id: string;
  name: string;
  description?: string;
  schedule: ScheduleSpec;
  target: ScheduledJobTarget;
  status: ScheduledJobStatus;
  nextRunAt: string;
  lastRunAt?: string;
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateScheduledJobInput {
  name: string;
  description?: string;
  schedule: ScheduleSpec;
  target: ScheduledJobTarget;
  status?: ScheduledJobStatus;
  userId?: string;
}

export type UpdateScheduledJobInput = Partial<Omit<CreateScheduledJobInput, "userId">>;

export interface ScheduledJobListQuery {
  status?: ScheduledJobStatus;
  userId?: string;
  limit?: number;
}

export interface ScheduledJobStore {
  insert(job: ScheduledJob): Promise<ScheduledJob>;
  update(id: string, job: ScheduledJob): Promise<ScheduledJob | null>;
  delete(id: string): Promise<boolean>;
  getById(id: string): Promise<ScheduledJob | null>;
  /** Every job matching `query`, used by `tick()` with `{ status: "active" }` to find candidates. Filtering by `nextRunAt <= now` happens in `Scheduler.tick()` itself, not the store, so the "what's due" logic lives in one place. */
  list(query: ScheduledJobListQuery): Promise<ScheduledJob[]>;
}

// ---------------------------------------------------------------------------
// Scheduled job runs (durable execution record)
// ---------------------------------------------------------------------------

export type ScheduledJobRunStatus = "completed" | "failed";

export interface ScheduledJobRun {
  id: string;
  jobId: string;
  status: ScheduledJobRunStatus;
  output: unknown;
  error: string | null;
  startedAt: string;
  completedAt: string;
}

export interface ScheduledJobRunListQuery {
  jobId?: string;
  status?: ScheduledJobRunStatus;
  limit?: number;
}

export interface ScheduledJobRunStore {
  insert(run: ScheduledJobRun): Promise<ScheduledJobRun>;
  getById(id: string): Promise<ScheduledJobRun | null>;
  list(query: ScheduledJobRunListQuery): Promise<ScheduledJobRun[]>;
}

// ---------------------------------------------------------------------------
// Dependency interop (decoupled — see file doc comment)
// ---------------------------------------------------------------------------

/** Mirrors the fields of `WorkflowRun` in `@workspace/workflow-engine` that the Scheduler actually needs. */
export interface WorkflowRunResult {
  status: string;
  error: string | null;
}

export interface WorkflowRunner {
  run(workflowId: string, input: unknown, userId?: string): Promise<WorkflowRunResult>;
}

export interface TaskEnqueuer {
  enqueue<TPayload = unknown>(
    type: string,
    source: string,
    payload: TPayload,
    options?: {
      queue?: string;
      priority?: number;
      maxAttempts?: number;
      correlationId?: string;
      causationId?: string;
      userId?: string;
    },
  ): Promise<{ id: string }>;
}

export interface SchedulerDependencies {
  workflowRunner?: WorkflowRunner;
  taskEnqueuer?: TaskEnqueuer;
}

export interface SchedulerLogger {
  debug(obj: Record<string, unknown>, msg?: string): void;
  info(obj: Record<string, unknown>, msg?: string): void;
  warn(obj: Record<string, unknown>, msg?: string): void;
  error(obj: Record<string, unknown>, msg?: string): void;
}
