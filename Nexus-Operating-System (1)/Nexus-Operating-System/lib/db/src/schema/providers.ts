import { pgTable, text, timestamp, uuid, boolean, integer, doublePrecision } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const providersTable = pgTable("ai_providers", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  providerName: text("provider_name").notNull(),
  displayName: text("display_name").notNull(),
  apiKey: text("api_key").default(""),
  baseUrl: text("base_url").default(""),
  model: text("model").default(""),
  maxTokens: integer("max_tokens").default(4096),
  temperature: doublePrecision("temperature").default(0.7),
  timeout: integer("timeout").default(30),
  priority: integer("priority").default(99),
  enabled: boolean("enabled").default(false),
  status: text("status").default("offline"),
  isLocal: boolean("is_local").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Provider = typeof providersTable.$inferSelect;
export type InsertProvider = typeof providersTable.$inferInsert;
