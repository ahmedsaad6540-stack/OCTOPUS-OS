import { pgTable, text, timestamp, uuid, jsonb, boolean, integer, index } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

/**
 * Durable, data-defined rules the Rule Engine compiles into `DecisionRule`s
 * and registers against the Brain. This is the Rule Engine's own state —
 * distinct from `brain_decisions`, which records what happened *when* a
 * compiled rule matched an event, not the rule definition itself.
 */
export const ruleDefinitionsTable = pgTable(
  "rule_definitions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    description: text("description"),

    // Exact event type, a "namespace.*" prefix wildcard, or "*".
    eventPattern: text("event_pattern").notNull(),

    // Condition tree (see @workspace/rule-engine's `Condition` type).
    condition: jsonb("condition").notNull(),

    // Action template (see @workspace/rule-engine's `ActionTemplate` type).
    action: jsonb("action").notNull(),

    priority: integer("priority").notNull().default(0),
    enabled: boolean("enabled").notNull().default(true),

    userId: uuid("user_id").references(() => usersTable.id, { onDelete: "set null" }),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("rule_definitions_event_pattern_idx").on(table.eventPattern),
    index("rule_definitions_enabled_idx").on(table.enabled),
    index("rule_definitions_user_id_idx").on(table.userId),
  ],
);

export type RuleDefinitionRecord = typeof ruleDefinitionsTable.$inferSelect;
export type InsertRuleDefinitionRecord = typeof ruleDefinitionsTable.$inferInsert;
