import { pgTable, text, timestamp, uuid, jsonb, index, uniqueIndex } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

/**
 * A registered tool: its invocation name, description, input schema (a
 * minimal JSON-Schema-like structure — see `@workspace/tool-manager`'s
 * `JsonSchema` type), and which in-process handler runs it. `name` is
 * unique — it's the key both `ToolManager.invoke()` and an agent's
 * `capabilities` entries reference.
 */
export const toolsTable = pgTable(
  "tools",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    inputSchema: jsonb("input_schema").notNull(),
    handlerName: text("handler_name").notNull(),
    status: text("status").notNull().default("active"),
    userId: uuid("user_id").references(() => usersTable.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("tools_name_idx").on(table.name),
    index("tools_status_idx").on(table.status),
    index("tools_handler_name_idx").on(table.handlerName),
    index("tools_user_id_idx").on(table.userId),
  ],
);

export type ToolRecord = typeof toolsTable.$inferSelect;
export type InsertToolRecord = typeof toolsTable.$inferInsert;
