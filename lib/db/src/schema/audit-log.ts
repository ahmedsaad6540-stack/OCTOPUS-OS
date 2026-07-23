import { pgTable, text, timestamp, uuid, jsonb, index } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

/**
 * Append-only, cross-cutting audit trail — who did what, to what, and
 * when. Distinct from every other module's own `createdAt`/`userId`
 * columns on its own entities: this is the one place a mutating action
 * across *any* module is recorded uniformly, populated by an Express
 * middleware in the api-server rather than by each route writing to it
 * individually.
 */
export const auditLogTable = pgTable(
  "audit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    action: text("action").notNull(),
    resourceType: text("resource_type").notNull(),
    resourceId: text("resource_id"),
    actorUserId: uuid("actor_user_id").references(() => usersTable.id, { onDelete: "set null" }),
    actorRole: text("actor_role"),
    ipAddress: text("ip_address"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("audit_log_action_idx").on(table.action),
    index("audit_log_resource_type_idx").on(table.resourceType),
    index("audit_log_actor_user_id_idx").on(table.actorUserId),
    index("audit_log_created_at_idx").on(table.createdAt),
  ],
);

export type AuditLogRecord = typeof auditLogTable.$inferSelect;
export type InsertAuditLogRecord = typeof auditLogTable.$inferInsert;
