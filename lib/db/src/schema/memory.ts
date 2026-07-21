import { pgTable, text, timestamp, uuid, jsonb, vector } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { agentsTable } from "./agents";

export const memoryTable = pgTable("agent_memory", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  agentId: uuid("agent_id").notNull().references(() => agentsTable.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  embedding: vector("embedding", { dimensions: 1536 }), // OpenAI default dimension
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Memory = typeof memoryTable.$inferSelect;
export type InsertMemory = typeof memoryTable.$inferInsert;
