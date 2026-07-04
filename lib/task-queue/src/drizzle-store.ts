import { and, asc, desc, eq, lte, lt, sql } from "drizzle-orm";
import { tasksTable, type TaskRecord } from "@workspace/db/schema";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { OctopusTask, TaskListQuery, TaskStore } from "./types.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = NodePgDatabase<any>;

function toOctopusTask(record: TaskRecord): OctopusTask {
  return {
    id: record.id,
    type: record.type,
    queue: record.queue,
    status: record.status as OctopusTask["status"],
    priority: record.priority,
    payload: record.payload,
    result: record.result ?? null,
    error: record.error ?? null,
    attempts: record.attempts,
    maxAttempts: record.maxAttempts,
    availableAt: record.availableAt.toISOString(),
    lockedBy: record.lockedBy ?? null,
    lockedAt: record.lockedAt ? record.lockedAt.toISOString() : null,
    startedAt: record.startedAt ? record.startedAt.toISOString() : null,
    completedAt: record.completedAt ? record.completedAt.toISOString() : null,
    source: record.source,
    correlationId: record.correlationId,
    ...(record.causationId ? { causationId: record.causationId } : {}),
    ...(record.userId ? { userId: record.userId } : {}),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

/**
 * Production task store, backed by the `tasks` table in Postgres. Mirrors
 * `DrizzleEventStore` in `@workspace/event-bus`.
 *
 * `claimNext` is the one operation that must be safe under concurrent
 * callers (multiple worker processes claiming from the same queue at once):
 * it runs `SELECT ... FOR UPDATE SKIP LOCKED` inside a transaction, so two
 * simultaneous claims always land on different rows instead of racing for
 * the same task or blocking on each other.
 */
export class DrizzleTaskStore implements TaskStore {
  constructor(private readonly db: Db) {}

  async insert(task: OctopusTask): Promise<OctopusTask> {
    const [row] = await this.db
      .insert(tasksTable)
      .values({
        id: task.id,
        type: task.type,
        queue: task.queue,
        status: task.status,
        priority: task.priority,
        payload: task.payload,
        result: task.result,
        error: task.error,
        attempts: task.attempts,
        maxAttempts: task.maxAttempts,
        availableAt: new Date(task.availableAt),
        lockedBy: task.lockedBy,
        lockedAt: task.lockedAt ? new Date(task.lockedAt) : null,
        startedAt: task.startedAt ? new Date(task.startedAt) : null,
        completedAt: task.completedAt ? new Date(task.completedAt) : null,
        source: task.source,
        correlationId: task.correlationId,
        causationId: task.causationId ?? null,
        userId: task.userId ?? null,
      })
      .returning();
    if (!row) throw new Error("Task insert returned no row");
    return toOctopusTask(row);
  }

  async getById(taskId: string): Promise<OctopusTask | null> {
    const rows = await this.db.select().from(tasksTable).where(eq(tasksTable.id, taskId)).limit(1);
    return rows[0] ? toOctopusTask(rows[0]) : null;
  }

  async list(query: TaskListQuery): Promise<OctopusTask[]> {
    const conditions = [];
    if (query.status) conditions.push(eq(tasksTable.status, query.status));
    if (query.type) conditions.push(eq(tasksTable.type, query.type));
    if (query.queue) conditions.push(eq(tasksTable.queue, query.queue));
    if (query.userId) conditions.push(eq(tasksTable.userId, query.userId));
    if (query.correlationId) conditions.push(eq(tasksTable.correlationId, query.correlationId));

    const safeLimit =
      typeof query.limit === "number" && Number.isFinite(query.limit) ? query.limit : 50;

    const rows = await this.db
      .select()
      .from(tasksTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(tasksTable.createdAt))
      .limit(Math.min(Math.max(safeLimit, 1), 200));

    return rows.map(toOctopusTask);
  }

  async claimNext(queue: string, workerId: string, now: Date): Promise<OctopusTask | null> {
    return this.db.transaction(async (tx) => {
      const candidates = await tx
        .select()
        .from(tasksTable)
        .where(
          and(
            eq(tasksTable.queue, queue),
            eq(tasksTable.status, "queued"),
            lte(tasksTable.availableAt, now),
          ),
        )
        .orderBy(desc(tasksTable.priority), asc(tasksTable.availableAt))
        .limit(1)
        .for("update", { skipLocked: true });

      const candidate = candidates[0];
      if (!candidate) return null;

      const [updated] = await tx
        .update(tasksTable)
        .set({
          status: "running",
          attempts: candidate.attempts + 1,
          lockedBy: workerId,
          lockedAt: now,
          startedAt: candidate.startedAt ?? now,
          updatedAt: now,
        })
        .where(eq(tasksTable.id, candidate.id))
        .returning();

      return updated ? toOctopusTask(updated) : null;
    });
  }

  async markCompleted(taskId: string, result: unknown, now: Date): Promise<OctopusTask | null> {
    const [row] = await this.db
      .update(tasksTable)
      .set({
        status: "completed",
        result: result ?? null,
        error: null,
        lockedBy: null,
        lockedAt: null,
        completedAt: now,
        updatedAt: now,
      })
      .where(eq(tasksTable.id, taskId))
      .returning();
    return row ? toOctopusTask(row) : null;
  }

  async markFailedPermanently(taskId: string, error: string, now: Date): Promise<OctopusTask | null> {
    const [row] = await this.db
      .update(tasksTable)
      .set({
        status: "failed",
        error,
        lockedBy: null,
        lockedAt: null,
        completedAt: now,
        updatedAt: now,
      })
      .where(eq(tasksTable.id, taskId))
      .returning();
    return row ? toOctopusTask(row) : null;
  }

  async scheduleRetry(
    taskId: string,
    error: string,
    availableAt: Date,
    now: Date,
  ): Promise<OctopusTask | null> {
    const [row] = await this.db
      .update(tasksTable)
      .set({
        status: "queued",
        error,
        lockedBy: null,
        lockedAt: null,
        availableAt,
        updatedAt: now,
      })
      .where(eq(tasksTable.id, taskId))
      .returning();
    return row ? toOctopusTask(row) : null;
  }

  async cancel(taskId: string, now: Date): Promise<OctopusTask | null> {
    const [row] = await this.db
      .update(tasksTable)
      .set({
        status: "cancelled",
        lockedBy: null,
        lockedAt: null,
        completedAt: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(tasksTable.id, taskId),
          sql`${tasksTable.status} in ('queued', 'running')`,
        ),
      )
      .returning();
    return row ? toOctopusTask(row) : null;
  }

  async reclaimStale(olderThan: Date, now: Date): Promise<OctopusTask[]> {
    return this.db.transaction(async (tx) => {
      const stale = await tx
        .select()
        .from(tasksTable)
        .where(and(eq(tasksTable.status, "running"), lt(tasksTable.lockedAt, olderThan)))
        .for("update", { skipLocked: true });

      if (stale.length === 0) return [];

      const reclaimed: OctopusTask[] = [];
      for (const task of stale) {
        const [row] = await tx
          .update(tasksTable)
          .set({
            status: "queued",
            lockedBy: null,
            lockedAt: null,
            availableAt: now,
            updatedAt: now,
          })
          .where(eq(tasksTable.id, task.id))
          .returning();
        if (row) reclaimed.push(toOctopusTask(row));
      }
      return reclaimed;
    });
  }
}
