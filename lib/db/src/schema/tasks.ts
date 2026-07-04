import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";

/**
 * Durable backing store for OS Core's Task Manager + Queue Manager.
 *
 * A single table serves both responsibilities intentionally:
 *  - Task Manager: the full lifecycle record of a unit of work (who asked
 *    for it, what happened, what it produced).
 *  - Queue Manager: the claim/lock/retry mechanics that let workers pull
 *    tasks safely across processes (`availableAt`, `lockedBy`, `lockedAt`,
 *    `attempts`) without two workers ever executing the same task.
 *
 * Splitting these into two tables would require keeping them in lockstep on
 * every state transition for no isolation benefit, since nothing ever reads
 * one without the other. Like the Event Bus's `events` table, this is the
 * durable substrate the rest of OS Core (the Brain, agents, future modules)
 * builds on for cross-process, durable task dispatch and redelivery.
 */
export const taskStatusValues = [
  "queued",
  "running",
  "completed",
  "failed",
  "cancelled",
] as const;
export type TaskStatus = (typeof taskStatusValues)[number];

export const tasksTable = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // Dot-namespaced task type, e.g. "campaign.publish", "agent.prophet.predict"
    type: text("type").notNull(),

    // Named lane a worker claims from. Lets different worker pools serve
    // different kinds of work without contending on the same queue.
    queue: text("queue").notNull().default("default"),

    status: text("status").notNull().default("queued"),

    // Higher priority is claimed first within a queue.
    priority: integer("priority").notNull().default(0),

    payload: jsonb("payload").notNull(),
    result: jsonb("result"),
    error: text("error"),

    attempts: integer("attempts").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(3),

    // A task is only claimable once now() >= availableAt. Used both for
    // scheduled/delayed tasks and for backoff between retries.
    availableAt: timestamp("available_at").notNull().defaultNow(),

    // Identity of the worker currently holding the claim, if any. Combined
    // with lockedAt, lets reclaimStale() detect and requeue tasks abandoned
    // by a crashed worker.
    lockedBy: text("locked_by"),
    lockedAt: timestamp("locked_at"),

    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),

    // Originating module/agent identity, e.g. "os-core", "agent:prophet", "api-server"
    source: text("source").notNull(),

    // Groups this task with the event/request chain that produced it
    correlationId: uuid("correlation_id").notNull(),
    causationId: uuid("causation_id"),

    userId: uuid("user_id").references(() => usersTable.id, { onDelete: "set null" }),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    // Matches the claim query's WHERE + ORDER BY exactly, so claiming the
    // next task never requires a sequential scan.
    index("tasks_claim_idx").on(
      table.queue,
      table.status,
      table.priority,
      table.availableAt,
    ),
    index("tasks_type_idx").on(table.type),
    index("tasks_status_idx").on(table.status),
    index("tasks_correlation_id_idx").on(table.correlationId),
    index("tasks_user_id_idx").on(table.userId),
  ],
);

export type TaskRecord = typeof tasksTable.$inferSelect;
export type InsertTaskRecord = typeof tasksTable.$inferInsert;
