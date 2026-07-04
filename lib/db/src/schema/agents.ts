import { pgTable, text, timestamp, uuid, jsonb, index } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

/**
 * A registered agent: identity, operating instructions, and the
 * capabilities it's allowed to use. The Agent Manager owns lifecycle here
 * (`status`) but never executes an agent itself — see `AgentExecutor` in
 * `@workspace/agent-manager`, fulfilled by the AI Provider Manager.
 */
export const agentsTable = pgTable(
  "agents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    description: text("description"),
    instructions: text("instructions").notNull(),
    capabilities: jsonb("capabilities").notNull().default([]),
    status: text("status").notNull().default("active"),
    userId: uuid("user_id").references(() => usersTable.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("agents_status_idx").on(table.status),
    index("agents_user_id_idx").on(table.userId),
  ],
);

export type AgentRecord = typeof agentsTable.$inferSelect;
export type InsertAgentRecord = typeof agentsTable.$inferInsert;

/** Durable record of one invocation of one agent, regardless of outcome. */
export const agentRunsTable = pgTable(
  "agent_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    agentId: uuid("agent_id")
      .notNull()
      .references(() => agentsTable.id, { onDelete: "cascade" }),
    status: text("status").notNull(),
    input: jsonb("input"),
    output: jsonb("output"),
    error: text("error"),
    userId: uuid("user_id").references(() => usersTable.id, { onDelete: "set null" }),
    startedAt: timestamp("started_at").notNull().defaultNow(),
    completedAt: timestamp("completed_at"),
  },
  (table) => [
    index("agent_runs_agent_id_idx").on(table.agentId),
    index("agent_runs_status_idx").on(table.status),
    index("agent_runs_user_id_idx").on(table.userId),
    index("agent_runs_started_at_idx").on(table.startedAt),
  ],
);

export type AgentRunRecord = typeof agentRunsTable.$inferSelect;
export type InsertAgentRunRecord = typeof agentRunsTable.$inferInsert;
