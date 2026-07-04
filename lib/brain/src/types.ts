/**
 * The Brain is the only decision maker in OS Core. It never talks to
 * agents or modules directly — it reacts to events on the Event Bus by
 * running them through registered `DecisionRule`s, and acts on whatever a
 * rule decides by enqueuing a task or publishing a follow-up event. Every
 * decision, acted on or not, is recorded durably so "why did this happen"
 * is always answerable from the `brain_decisions` table.
 *
 * Like `@workspace/task-queue`, this package never imports
 * `@workspace/event-bus` at compile time. Instead it declares the minimal
 * shape it needs (`EventSubscriber`, `EventPublisher`) and depends on
 * structural typing — `EventBus` satisfies both without either package
 * knowing the other exists. `BrainEvent` mirrors `OctopusEvent`'s shape
 * exactly so a real `EventBus` can be passed in without adaptation.
 */

// ---------------------------------------------------------------------------
// Events (as seen by the Brain)
// ---------------------------------------------------------------------------

export interface BrainEventMetadata {
  correlationId: string;
  causationId?: string;
  userId?: string;
}

export interface BrainEvent<TPayload = unknown> {
  id: string;
  type: string;
  version: number;
  source: string;
  payload: TPayload;
  metadata: BrainEventMetadata;
  occurredAt: string;
}

export type Unsubscribe = () => void;

/** Minimal event-subscribing capability the Brain depends on. `EventBus` satisfies this structurally. */
export interface EventSubscriber {
  subscribe<TPayload = unknown>(
    pattern: string,
    handlerName: string,
    handler: (event: BrainEvent<TPayload>) => Promise<void> | void,
  ): Unsubscribe;
}

/** Minimal event-publishing capability the Brain depends on. Mirrors `EventPublisher` in `@workspace/task-queue`. */
export interface EventPublisher {
  publish<TPayload = unknown>(
    type: string,
    source: string,
    payload: TPayload,
    options?: {
      correlationId?: string;
      causationId?: string;
      userId?: string;
      version?: number;
    },
  ): Promise<unknown>;
}

// ---------------------------------------------------------------------------
// Task enqueuing (as used by the Brain)
// ---------------------------------------------------------------------------

/** Minimal task-enqueuing capability the Brain depends on. `TaskQueue` satisfies this structurally. */
export interface TaskEnqueuer {
  enqueue<TPayload = unknown>(
    type: string,
    source: string,
    payload: TPayload,
    options?: {
      queue?: string;
      priority?: number;
      maxAttempts?: number;
      correlationId?: string;
      causationId?: string;
      userId?: string;
    },
  ): Promise<{ id: string }>;
}

// ---------------------------------------------------------------------------
// Decision rules
// ---------------------------------------------------------------------------

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

/** What a rule decides to do about a matched event. Return `null`/`undefined` (or an explicit `noop`) if the rule has nothing to do. */
export type RuleDecision =
  | {
      action: "enqueue_task";
      reason: string;
      task: {
        type: string;
        payload: unknown;
        queue?: string;
        priority?: number;
        maxAttempts?: number;
      };
    }
  | {
      action: "publish_event";
      reason: string;
      event: { type: string; payload: unknown };
    }
  | { action: "noop"; reason: string }
  | null
  | undefined;

export interface DecisionRule<TPayload = unknown> {
  /** Unique, stable name. Recorded on every decision this rule produces and used as the Decision Engine's candidate key. */
  name: string;
  /** Exact event type, a `"namespace.*"` prefix wildcard, or `"*"` for every event — same pattern syntax as `EventBus.subscribe`. */
  pattern: string;
  /** Used by priority-based arbitration strategies when more than one rule matches the same event. Defaults to 0. Ignored by `allMatchStrategy`, the Brain's default. */
  priority?: number;
  evaluate(event: BrainEvent<TPayload>): RuleDecision | Promise<RuleDecision>;
}

// ---------------------------------------------------------------------------
// Decisions (durable record)
// ---------------------------------------------------------------------------

/**
 * A durable record of one decision the Brain made about one event, and what
 * happened when it acted on it.
 */
export interface BrainDecision {
  id: string;
  ruleName: string;
  eventId: string;
  eventType: string;
  action: DecisionAction;
  reason: string;
  actionPayload: unknown;
  outcome: DecisionOutcome;
  outcomeDetail: unknown;
  correlationId: string;
  causationId?: string;
  userId?: string;
  createdAt: string;
}

export interface DecisionListQuery {
  ruleName?: string;
  eventType?: string;
  outcome?: DecisionOutcome;
  correlationId?: string;
  userId?: string;
  limit?: number;
}

export interface BrainStore {
  insert(decision: BrainDecision): Promise<BrainDecision>;
  getById(id: string): Promise<BrainDecision | null>;
  list(query: DecisionListQuery): Promise<BrainDecision[]>;
}

// ---------------------------------------------------------------------------
// Logger (same minimal shape as Event Bus / Task Queue)
// ---------------------------------------------------------------------------

export interface BrainLogger {
  debug(obj: Record<string, unknown>, msg?: string): void;
  info(obj: Record<string, unknown>, msg?: string): void;
  warn(obj: Record<string, unknown>, msg?: string): void;
  error(obj: Record<string, unknown>, msg?: string): void;
}
