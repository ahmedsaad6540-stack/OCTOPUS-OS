import { pgTable, text, timestamp, uuid, jsonb, uniqueIndex, index } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

/**
 * Key-value settings at `system` or `user` scope. `compositeKey` is
 * `system:<key>` or `user:<userId>:<key>`, computed and maintained by
 * `@workspace/settings`'s store — its uniqueness is what makes `set()` a
 * true upsert (`INSERT ... ON CONFLICT (composite_key) DO UPDATE`) rather
 * than a read-then-write race.
 */
export const settingsTable = pgTable(
  "settings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    scope: text("scope").notNull(),
    key: text("key").notNull(),
    userId: uuid("user_id").references(() => usersTable.id, { onDelete: "cascade" }),
    compositeKey: text("composite_key").notNull(),
    value: jsonb("value"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("settings_composite_key_idx").on(table.compositeKey),
    index("settings_scope_idx").on(table.scope),
    index("settings_user_id_idx").on(table.userId),
  ],
);

export type SettingRecord = typeof settingsTable.$inferSelect;
export type InsertSettingRecord = typeof settingsTable.$inferInsert;
