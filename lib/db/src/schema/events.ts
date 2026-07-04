import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";

/**
 * Durable event store for the OS Core Event Bus.
 *
 * Every event published anywhere in OCTOPUS OS is persisted here before
 * being dispatched to in-process subscribers. This is the audit trail and
 * replay source for the whole system: agents, the Brain, the Learning
 * Engine and Reflection all read their history from this table rather than
 * from each other directly, since agents never communicate with each other
 * directly — everything flows through events.
 */
export const eventStatusValues = ["published", "dispatched", "failed"] as const;
export type EventStatus = (typeof eventStatusValues)[number];

export const eventsTable = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // Dot-namespaced event type, e.g. "campaign.created", "agent.prophet.prediction.completed"
    type: text("type").notNull(),

    // Schema version of `payload`, so consumers can handle evolution safely
    version: integer("version").notNull().default(1),

    // Originating module/agent identity, e.g. "os-core", "agent:prophet", "api-server"
    source: text("source").notNull(),

    payload: jsonb("payload").notNull(),

    // Groups events that belong to the same logical operation/request
    correlationId: uuid("correlation_id").notNull(),

    // The event (if any) that caused this event to be published
    causationId: uuid("causation_id"),

    userId: uuid("user_id").references(() => usersTable.id, { onDelete: "set null" }),

    status: text("status").notNull().default("published"),

    // Per-handler failures recorded during dispatch, e.g.
    // [{ handler: "learning-engine", error: "timeout", failedAt: "..." }]
    handlerErrors: jsonb("handler_errors"),

    occurredAt: timestamp("occurred_at").notNull().defaultNow(),
    dispatchedAt: timestamp("dispatched_at"),
  },
  (table) => [
    index("events_type_idx").on(table.type),
    index("events_correlation_id_idx").on(table.correlationId),
    index("events_occurred_at_idx").on(table.occurredAt),
    index("events_status_idx").on(table.status),
  ],
);

export type EventRecord = typeof eventsTable.$inferSelect;
export type InsertEventRecord = typeof eventsTable.$inferInsert;
