import {
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";

/**
 * Durable record of every decision the Brain makes, and what happened when
 * it acted on that decision. This is OS Core's "why did this happen" trail
 * — every row is caused by exactly one event on `@workspace/event-bus`
 * (`eventId`) and, once acted on, is itself the cause of whatever the Brain
 * did next (an enqueued task, a published follow-up event). Sits alongside
 * the `events` and `tasks` tables as the third piece of OS Core's durable
 * substrate.
 */
export const decisionActionValues = [
  "enqueue_task",
  "publish_event",
  "noop",
] as const;
export type DecisionAction = (typeof decisionActionValues)[number];

export const decisionOutcomeValues = [
  "actioned",
  "noop",
  "action_failed",
  "superseded",
] as const;
export type DecisionOutcome = (typeof decisionOutcomeValues)[number];

export const brainDecisionsTable = pgTable(
  "brain_decisions",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // Name of the DecisionRule that produced this decision.
    ruleName: text("rule_name").notNull(),

    // The event this decision is about. Not a foreign key into `events`
    // (the Brain is decoupled from `@workspace/event-bus` at compile time,
    // same as the Task/Queue Manager — see `lib/brain/src/types.ts`), but
    // cross-referenced by id for audit/replay.
    eventId: uuid("event_id").notNull(),
    eventType: text("event_type").notNull(),

    action: text("action").notNull(),
    reason: text("reason").notNull(),

    // Action-specific payload: the task the Brain chose to enqueue, or the
    // event it chose to publish. Null for "noop" decisions.
    actionPayload: jsonb("action_payload"),

    outcome: text("outcome").notNull(),

    // Result of carrying out the action: e.g. { taskId } for enqueue_task,
    // { published: { id, type } } for publish_event, { error } if the
    // action itself failed, or { strategy } naming the Decision Engine
    // arbitration strategy that superseded this candidate in favor of
    // another rule's for the same event.
    outcomeDetail: jsonb("outcome_detail"),

    // Groups this decision with the event/request chain that produced it
    correlationId: uuid("correlation_id").notNull(),
    causationId: uuid("causation_id"),

    userId: uuid("user_id").references(() => usersTable.id, { onDelete: "set null" }),

    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("brain_decisions_rule_name_idx").on(table.ruleName),
    index("brain_decisions_event_type_idx").on(table.eventType),
    index("brain_decisions_event_id_idx").on(table.eventId),
    index("brain_decisions_correlation_id_idx").on(table.correlationId),
    index("brain_decisions_outcome_idx").on(table.outcome),
    index("brain_decisions_created_at_idx").on(table.createdAt),
    index("brain_decisions_user_id_idx").on(table.userId),
  ],
);

export type BrainDecisionRecord = typeof brainDecisionsTable.$inferSelect;
export type InsertBrainDecisionRecord = typeof brainDecisionsTable.$inferInsert;
