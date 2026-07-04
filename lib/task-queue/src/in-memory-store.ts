import type { OctopusTask, TaskListQuery, TaskStore } from "./types.js";

/**
 * In-memory task store for unit tests and local scripts that don't want a
 * database dependency. Never used in production — the api-server always
 * wires up `DrizzleTaskStore`. Mirrors `InMemoryEventStore` in
 * `@workspace/event-bus`.
 *
 * Deliberately kept free of any Postgres/Drizzle imports (unlike
 * `drizzle-store.ts`) so it — and everything built on it — can be exercised
 * in environments with no database and no installed dependencies at all.
 */
export class InMemoryTaskStore implements TaskStore {
  private readonly tasks = new Map<string, OctopusTask>();

  async insert(task: OctopusTask): Promise<OctopusTask> {
    this.tasks.set(task.id, { ...task });
    return { ...task };
  }

  async getById(taskId: string): Promise<OctopusTask | null> {
    const task = this.tasks.get(taskId);
    return task ? { ...task } : null;
  }

  async list(query: TaskListQuery): Promise<OctopusTask[]> {
    let results = Array.from(this.tasks.values());
    if (query.status) results = results.filter((t) => t.status === query.status);
    if (query.type) results = results.filter((t) => t.type === query.type);
    if (query.queue) results = results.filter((t) => t.queue === query.queue);
    if (query.userId) results = results.filter((t) => t.userId === query.userId);
    if (query.correlationId) {
      results = results.filter((t) => t.correlationId === query.correlationId);
    }
    results.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    const safeLimit =
      typeof query.limit === "number" && Number.isFinite(query.limit) ? query.limit : 50;
    return results.slice(0, Math.min(Math.max(safeLimit, 1), 200)).map((t) => ({ ...t }));
  }

  async claimNext(queue: string, workerId: string, now: Date): Promise<OctopusTask | null> {
    const nowIso = now.toISOString();
    const eligible = Array.from(this.tasks.values())
      .filter((t) => t.queue === queue && t.status === "queued" && t.availableAt <= nowIso)
      .sort((a, b) => {
        if (a.priority !== b.priority) return b.priority - a.priority;
        return a.availableAt < b.availableAt ? -1 : 1;
      });

    const next = eligible[0];
    if (!next) return null;

    const claimed: OctopusTask = {
      ...next,
      status: "running",
      attempts: next.attempts + 1,
      lockedBy: workerId,
      lockedAt: nowIso,
      startedAt: next.startedAt ?? nowIso,
      updatedAt: nowIso,
    };
    this.tasks.set(claimed.id, claimed);
    return { ...claimed };
  }

  async markCompleted(taskId: string, result: unknown, now: Date): Promise<OctopusTask | null> {
    const task = this.tasks.get(taskId);
    if (!task) return null;
    const updated: OctopusTask = {
      ...task,
      status: "completed",
      result,
      error: null,
      lockedBy: null,
      lockedAt: null,
      completedAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    this.tasks.set(taskId, updated);
    return { ...updated };
  }

  async markFailedPermanently(taskId: string, error: string, now: Date): Promise<OctopusTask | null> {
    const task = this.tasks.get(taskId);
    if (!task) return null;
    const updated: OctopusTask = {
      ...task,
      status: "failed",
      error,
      lockedBy: null,
      lockedAt: null,
      completedAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    this.tasks.set(taskId, updated);
    return { ...updated };
  }

  async scheduleRetry(
    taskId: string,
    error: string,
    availableAt: Date,
    now: Date,
  ): Promise<OctopusTask | null> {
    const task = this.tasks.get(taskId);
    if (!task) return null;
    const updated: OctopusTask = {
      ...task,
      status: "queued",
      error,
      lockedBy: null,
      lockedAt: null,
      availableAt: availableAt.toISOString(),
      updatedAt: now.toISOString(),
    };
    this.tasks.set(taskId, updated);
    return { ...updated };
  }

  async cancel(taskId: string, now: Date): Promise<OctopusTask | null> {
    const task = this.tasks.get(taskId);
    if (!task) return null;
    if (task.status !== "queued" && task.status !== "running") return null;
    const updated: OctopusTask = {
      ...task,
      status: "cancelled",
      lockedBy: null,
      lockedAt: null,
      completedAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    this.tasks.set(taskId, updated);
    return { ...updated };
  }

  async reclaimStale(olderThan: Date, now: Date): Promise<OctopusTask[]> {
    const olderThanIso = olderThan.toISOString();
    const reclaimed: OctopusTask[] = [];
    for (const task of this.tasks.values()) {
      if (
        task.status === "running" &&
        task.lockedAt !== null &&
        task.lockedAt < olderThanIso
      ) {
        const updated: OctopusTask = {
          ...task,
          status: "queued",
          lockedBy: null,
          lockedAt: null,
          availableAt: now.toISOString(),
          updatedAt: now.toISOString(),
        };
        this.tasks.set(task.id, updated);
        reclaimed.push({ ...updated });
      }
    }
    return reclaimed;
  }
}
