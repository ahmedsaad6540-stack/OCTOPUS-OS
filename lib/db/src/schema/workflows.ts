import { pgTable, text, timestamp, uuid, jsonb, index } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

/**
 * A workflow definition: a fixed, ordered sequence of steps (tool/agent/
 * task/event — see `@workspace/workflow-engine`'s `WorkflowStep` union),
 * stored as `steps` jsonb. The Workflow Engine never stores what a step
 * *does* beyond this data — every step delegates to the real module that
 * owns that capability at run time.
 */
export const workflowDefinitionsTable = pgTable(
  "workflow_definitions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    description: text("description"),
    steps: jsonb("steps").notNull(),
    status: text("status").notNull().default("active"),
    userId: uuid("user_id").references(() => usersTable.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("workflow_definitions_status_idx").on(table.status),
    index("workflow_definitions_user_id_idx").on(table.userId),
  ],
);

export type WorkflowDefinitionRecord = typeof workflowDefinitionsTable.$inferSelect;
export type InsertWorkflowDefinitionRecord = typeof workflowDefinitionsTable.$inferInsert;

/** Durable record of one run of one workflow: status, per-step results, and the run's error if it failed partway through. */
export const workflowRunsTable = pgTable(
  "workflow_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workflowId: uuid("workflow_id")
      .notNull()
      .references(() => workflowDefinitionsTable.id, { onDelete: "cascade" }),
    status: text("status").notNull(),
    input: jsonb("input"),
    stepResults: jsonb("step_results").notNull().default([]),
    error: text("error"),
    userId: uuid("user_id").references(() => usersTable.id, { onDelete: "set null" }),
    startedAt: timestamp("started_at").notNull().defaultNow(),
    completedAt: timestamp("completed_at"),
  },
  (table) => [
    index("workflow_runs_workflow_id_idx").on(table.workflowId),
    index("workflow_runs_status_idx").on(table.status),
    index("workflow_runs_user_id_idx").on(table.userId),
    index("workflow_runs_started_at_idx").on(table.startedAt),
  ],
);

export type WorkflowRunRecord = typeof workflowRunsTable.$inferSelect;
export type InsertWorkflowRunRecord = typeof workflowRunsTable.$inferInsert;
