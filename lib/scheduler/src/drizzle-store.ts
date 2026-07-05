import { and, desc, eq } from "drizzle-orm";
import {
  scheduledJobsTable,
  scheduledJobRunsTable,
  type ScheduledJobRecord,
  type ScheduledJobRunRecord,
} from "@workspace/db/schema";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type {
  ScheduledJob,
  ScheduledJobListQuery,
  ScheduledJobRun,
  ScheduledJobRunListQuery,
  ScheduledJobRunStore,
  ScheduledJobStatus,
  ScheduledJobStore,
  ScheduleSpec,
  ScheduledJobTarget,
} from "./types.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = NodePgDatabase<any>;

function toJob(record: ScheduledJobRecord): ScheduledJob {
  return {
    id: record.id,
    name: record.name,
    ...(record.description ? { description: record.description } : {}),
    schedule: record.schedule as ScheduleSpec,
    target: record.target as ScheduledJobTarget,
    status: record.status as ScheduledJobStatus,
    nextRunAt: record.nextRunAt.toISOString(),
    ...(record.lastRunAt ? { lastRunAt: record.lastRunAt.toISOString() } : {}),
    ...(record.userId ? { userId: record.userId } : {}),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export class DrizzleScheduledJobStore implements ScheduledJobStore {
  constructor(private readonly db: Db) {}

  async insert(job: ScheduledJob): Promise<ScheduledJob> {
    await this.db.insert(scheduledJobsTable).values({
      id: job.id,
      name: job.name,
      description: job.description ?? null,
      schedule: job.schedule,
      target: job.target,
      status: job.status,
      nextRunAt: new Date(job.nextRunAt),
      lastRunAt: job.lastRunAt ? new Date(job.lastRunAt) : null,
      userId: job.userId ?? null,
      createdAt: new Date(job.createdAt),
      updatedAt: new Date(job.updatedAt),
    });
    return job;
  }

  async update(id: string, job: ScheduledJob): Promise<ScheduledJob | null> {
    const rows = await this.db
      .update(scheduledJobsTable)
      .set({
        name: job.name,
        description: job.description ?? null,
        schedule: job.schedule,
        target: job.target,
        status: job.status,
        nextRunAt: new Date(job.nextRunAt),
        lastRunAt: job.lastRunAt ? new Date(job.lastRunAt) : null,
        updatedAt: new Date(job.updatedAt),
      })
      .where(eq(scheduledJobsTable.id, id))
      .returning();
    return rows[0] ? toJob(rows[0]) : null;
  }

  async delete(id: string): Promise<boolean> {
    const rows = await this.db.delete(scheduledJobsTable).where(eq(scheduledJobsTable.id, id)).returning();
    return rows.length > 0;
  }

  async getById(id: string): Promise<ScheduledJob | null> {
    const rows = await this.db.select().from(scheduledJobsTable).where(eq(scheduledJobsTable.id, id)).limit(1);
    return rows[0] ? toJob(rows[0]) : null;
  }

  async list(query: ScheduledJobListQuery): Promise<ScheduledJob[]> {
    const conditions = [];
    if (query.status) conditions.push(eq(scheduledJobsTable.status, query.status));
    if (query.userId) conditions.push(eq(scheduledJobsTable.userId, query.userId));

    const rawLimit = query.limit;
    const safeLimit = typeof rawLimit === "number" && Number.isFinite(rawLimit) ? rawLimit : 200;

    const rows = await this.db
      .select()
      .from(scheduledJobsTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(scheduledJobsTable.createdAt))
      .limit(Math.min(Math.max(safeLimit, 1), 1000));

    return rows.map(toJob);
  }
}

function toJobRun(record: ScheduledJobRunRecord): ScheduledJobRun {
  return {
    id: record.id,
    jobId: record.jobId,
    status: record.status as ScheduledJobRun["status"],
    output: record.output,
    error: record.error,
    startedAt: record.startedAt.toISOString(),
    completedAt: record.completedAt.toISOString(),
  };
}

export class DrizzleScheduledJobRunStore implements ScheduledJobRunStore {
  constructor(private readonly db: Db) {}

  async insert(run: ScheduledJobRun): Promise<ScheduledJobRun> {
    await this.db.insert(scheduledJobRunsTable).values({
      id: run.id,
      jobId: run.jobId,
      status: run.status,
      output: run.output ?? null,
      error: run.error,
      startedAt: new Date(run.startedAt),
      completedAt: new Date(run.completedAt),
    });
    return run;
  }

  async getById(id: string): Promise<ScheduledJobRun | null> {
    const rows = await this.db.select().from(scheduledJobRunsTable).where(eq(scheduledJobRunsTable.id, id)).limit(1);
    return rows[0] ? toJobRun(rows[0]) : null;
  }

  async list(query: ScheduledJobRunListQuery): Promise<ScheduledJobRun[]> {
    const conditions = [];
    if (query.jobId) conditions.push(eq(scheduledJobRunsTable.jobId, query.jobId));
    if (query.status) conditions.push(eq(scheduledJobRunsTable.status, query.status));

    const rawLimit = query.limit;
    const safeLimit = typeof rawLimit === "number" && Number.isFinite(rawLimit) ? rawLimit : 100;

    const rows = await this.db
      .select()
      .from(scheduledJobRunsTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(scheduledJobRunsTable.startedAt))
      .limit(Math.min(Math.max(safeLimit, 1), 500));

    return rows.map(toJobRun);
  }
}
