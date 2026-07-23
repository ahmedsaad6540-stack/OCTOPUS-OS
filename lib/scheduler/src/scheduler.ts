import { randomUUID } from "node:crypto";
import { computeNextRunAt } from "./cron.js";
import type {
  CreateScheduledJobInput,
  ScheduledJob,
  ScheduledJobListQuery,
  ScheduledJobRun,
  ScheduledJobRunListQuery,
  ScheduledJobRunStore,
  ScheduledJobStore,
  SchedulerDependencies,
  SchedulerLogger,
  UpdateScheduledJobInput,
} from "./types.js";

const noopLogger: SchedulerLogger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};

const DEFAULT_TICK_INTERVAL_MS = 30_000;

/**
 * Triggers a workflow run or a task enqueue on a cron expression or fixed
 * interval. `tick()` finds every active job whose `nextRunAt` has passed,
 * executes it, records a durable `ScheduledJobRun` regardless of outcome,
 * and reschedules `nextRunAt` for the next occurrence — whether this run
 * succeeded or failed, a recurring job keeps recurring. `start()` wraps
 * `tick()` in a plain interval timer for production use; tests call
 * `tick()` directly against an injectable `now` function instead of
 * waiting on real timers.
 *
 * Single-process assumption: `tick()` has no distributed lock, so running
 * more than one Scheduler instance against the same store risks a job
 * firing twice in the same window. Fine for one api-server process; a real
 * multi-replica deployment would need a claim mechanism the same way
 * `TaskQueue.claim()` has one.
 */
export class Scheduler {
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly jobStore: ScheduledJobStore,
    private readonly runStore: ScheduledJobRunStore,
    private readonly deps: SchedulerDependencies = {},
    private readonly logger: SchedulerLogger = noopLogger,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async create(input: CreateScheduledJobInput): Promise<ScheduledJob> {
    const nowDate = this.now();
    const nowIso = nowDate.toISOString();
    const job: ScheduledJob = {
      id: randomUUID(),
      name: input.name,
      ...(input.description !== undefined ? { description: input.description } : {}),
      schedule: input.schedule,
      target: input.target,
      status: input.status ?? "active",
      nextRunAt: computeNextRunAt(input.schedule, nowDate),
      ...(input.userId ? { userId: input.userId } : {}),
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    return this.jobStore.insert(job);
  }

  async update(id: string, input: UpdateScheduledJobInput): Promise<ScheduledJob | null> {
    const existing = await this.jobStore.getById(id);
    if (!existing) return null;

    const scheduleChanged = input.schedule !== undefined;
    const updated: ScheduledJob = {
      ...existing,
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.schedule !== undefined ? { schedule: input.schedule } : {}),
      ...(input.target !== undefined ? { target: input.target } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(scheduleChanged ? { nextRunAt: computeNextRunAt(input.schedule!, this.now()) } : {}),
      updatedAt: new Date().toISOString(),
    };
    return this.jobStore.update(id, updated);
  }

  async delete(id: string): Promise<boolean> {
    return this.jobStore.delete(id);
  }

  async enable(id: string): Promise<ScheduledJob | null> {
    return this.update(id, { status: "active" });
  }

  async disable(id: string): Promise<ScheduledJob | null> {
    return this.update(id, { status: "disabled" });
  }

  async get(id: string): Promise<ScheduledJob | null> {
    return this.jobStore.getById(id);
  }

  async list(query: ScheduledJobListQuery = {}): Promise<ScheduledJob[]> {
    return this.jobStore.list(query);
  }

  async getRun(id: string): Promise<ScheduledJobRun | null> {
    return this.runStore.getById(id);
  }

  async listRuns(query: ScheduledJobRunListQuery = {}): Promise<ScheduledJobRun[]> {
    return this.runStore.list(query);
  }

  /**
   * Executes every active job whose `nextRunAt` is due. Never throws —
   * a single job's failure (including a missing dependency for its target
   * type) is recorded on its own `ScheduledJobRun` and doesn't stop the
   * rest of the batch.
   */
  async tick(): Promise<void> {
    const nowDate = this.now();
    const active = await this.jobStore.list({ status: "active" });
    const due = active.filter((job) => new Date(job.nextRunAt).getTime() <= nowDate.getTime());

    for (const job of due) {
      await this.executeJob(job, nowDate);
    }
  }

  /** Starts a plain interval timer calling `tick()` every `intervalMs` (default 30s). A no-op if already started. The timer is `unref()`'d so it never keeps the process alive on its own. */
  start(intervalMs: number = DEFAULT_TICK_INTERVAL_MS): void {
    if (this.timer) return;
    this.timer = setInterval(() => {
      this.tick().catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.error({ error: message }, "scheduler.tick_failed");
      });
    }, intervalMs);
    this.timer.unref();
  }

  /** Stops the interval timer started by `start()`. A no-op if not running. */
  stop(): void {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = null;
  }

  private async executeJob(job: ScheduledJob, nowDate: Date): Promise<void> {
    const startedAt = nowDate.toISOString();
    let output: unknown = null;
    let error: string | null = null;

    try {
      output = await this.dispatch(job);
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    }

    const completedAt = new Date().toISOString();
    const run: ScheduledJobRun = {
      id: randomUUID(),
      jobId: job.id,
      status: error ? "failed" : "completed",
      output,
      error,
      startedAt,
      completedAt,
    };
    await this.runStore.insert(run);

    if (error) {
      this.logger.error({ jobId: job.id, error }, "scheduler.job_failed");
    } else {
      this.logger.info({ jobId: job.id }, "scheduler.job_completed");
    }

    const updated: ScheduledJob = {
      ...job,
      lastRunAt: startedAt,
      nextRunAt: computeNextRunAt(job.schedule, nowDate),
      updatedAt: new Date().toISOString(),
    };
    await this.jobStore.update(job.id, updated);
  }

  private async dispatch(job: ScheduledJob): Promise<unknown> {
    if (job.target.type === "workflow") {
      if (!this.deps.workflowRunner) throw new Error('No WorkflowRunner configured — cannot run "workflow" targeted jobs');
      const result = await this.deps.workflowRunner.run(job.target.workflowId, job.target.input, job.userId);
      if (result.status === "failed") throw new Error(result.error ?? `workflow "${job.target.workflowId}" run failed`);
      return result;
    }

    if (!this.deps.taskEnqueuer) throw new Error('No TaskEnqueuer configured — cannot run "task" targeted jobs');
    const task = await this.deps.taskEnqueuer.enqueue(job.target.taskType, "scheduler", job.target.payload, {
      ...(job.target.queue !== undefined ? { queue: job.target.queue } : {}),
      ...(job.target.priority !== undefined ? { priority: job.target.priority } : {}),
      ...(job.target.maxAttempts !== undefined ? { maxAttempts: job.target.maxAttempts } : {}),
      ...(job.userId ? { userId: job.userId } : {}),
    });
    return { taskId: task.id };
  }
}
