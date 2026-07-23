import { pgTable, text, timestamp, uuid, integer, doublePrecision } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const promptsTable = pgTable("prompts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  agent: text("agent").default("Brain"),
  category: text("category").default("Research"),
  content: text("content").notNull(),
  uses: integer("uses").default(0),
  rating: doublePrecision("rating").default(5.0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Prompt = typeof promptsTable.$inferSelect;
export type InsertPrompt = typeof promptsTable.$inferInsert;
