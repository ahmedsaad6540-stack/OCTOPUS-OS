import { pgTable, text, timestamp, uuid, jsonb, index } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

/**
 * A scheduled job: a cron expression or fixed interval (`schedule` jsonb —
 * see `@workspace/scheduler`'s `ScheduleSpec`) paired with a target — run a
 * workflow or enqueue a task (`target` jsonb — see `ScheduledJobTarget`).
 * `nextRunAt` is maintained by `Scheduler` itself, recomputed after every
 * execution (or whenever the schedule changes), so "what's due" is always
 * a simple `nextRunAt <= now` comparison.
 */
export const scheduledJobsTable = pgTable(
  "scheduled_jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    description: text("description"),
    schedule: jsonb("schedule").notNull(),
    target: jsonb("target").notNull(),
    status: text("status").notNull().default("active"),
    nextRunAt: timestamp("next_run_at").notNull(),
    lastRunAt: timestamp("last_run_at"),
    userId: uuid("user_id").references(() => usersTable.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("scheduled_jobs_status_idx").on(table.status),
    index("scheduled_jobs_next_run_at_idx").on(table.nextRunAt),
    index("scheduled_jobs_user_id_idx").on(table.userId),
  ],
);

export type ScheduledJobRecord = typeof scheduledJobsTable.$inferSelect;
export type InsertScheduledJobRecord = typeof scheduledJobsTable.$inferInsert;

/** Durable record of one execution of one scheduled job, regardless of outcome. */
export const scheduledJobRunsTable = pgTable(
  "scheduled_job_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jobId: uuid("job_id")
      .notNull()
      .references(() => scheduledJobsTable.id, { onDelete: "cascade" }),
    status: text("status").notNull(),
    output: jsonb("output"),
    error: text("error"),
    startedAt: timestamp("started_at").notNull(),
    completedAt: timestamp("completed_at").notNull(),
  },
  (table) => [
    index("scheduled_job_runs_job_id_idx").on(table.jobId),
    index("scheduled_job_runs_status_idx").on(table.status),
    index("scheduled_job_runs_started_at_idx").on(table.startedAt),
  ],
);

export type ScheduledJobRunRecord = typeof scheduledJobRunsTable.$inferSelect;
export type InsertScheduledJobRunRecord = typeof scheduledJobRunsTable.$inferInsert;
