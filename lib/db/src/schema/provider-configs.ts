import { pgTable, text, timestamp, uuid, boolean, index } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

/**
 * A configured AI provider for OS Core's AI Provider Manager: which vendor,
 * which model, and which environment variable holds the API key. The key
 * itself is never stored here — only its env var name — so this table is
 * safe to read/return over the API without leaking a credential.
 *
 * Deliberately a separate table from the pre-existing `ai_providers` table
 * (`providersTable` in `./providers.ts`, backing the legacy per-user
 * `/api/providers*` routes and the mockup's "AI Providers" page). That
 * table stores a raw `apiKey` string per user and predates OS Core; it is
 * left untouched. This table is `provider_configs`, backing
 * `/api/provider-configs*` and the real `AgentExecutor` wired into the
 * Agent Manager.
 */
export const providerConfigsTable = pgTable(
  "provider_configs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    providerType: text("provider_type").notNull(),
    model: text("model").notNull(),
    apiKeyEnvVar: text("api_key_env_var").notNull(),
    baseUrl: text("base_url"),
    isDefault: boolean("is_default").notNull().default(false),
    status: text("status").notNull().default("active"),
    userId: uuid("user_id").references(() => usersTable.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("provider_configs_provider_type_idx").on(table.providerType),
    index("provider_configs_status_idx").on(table.status),
    index("provider_configs_is_default_idx").on(table.isDefault),
    index("provider_configs_user_id_idx").on(table.userId),
  ],
);

export type ProviderConfigRecord = typeof providerConfigsTable.$inferSelect;
export type InsertProviderConfigRecord = typeof providerConfigsTable.$inferInsert;
