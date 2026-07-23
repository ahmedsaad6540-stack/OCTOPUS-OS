/**
 * The Rule Engine turns declarative, data-defined rules into `DecisionRule`s
 * the Brain can register — rules non-engineers (or other modules, at
 * runtime, via `/api/rules`) can create without shipping code. It owns
 * three things the Brain deliberately doesn't: a condition DSL for matching
 * events, durable storage of rule *definitions* (as opposed to the Brain's
 * storage of rule *decisions*), and hot registration/unregistration against
 * a running Brain as rules are created, updated, enabled, or deleted.
 *
 * Like every OS Core module before it, the Rule Engine never imports
 * `@workspace/brain` at compile time. `RuleEvent`/`RuleAction` mirror
 * `BrainEvent`/`RuleDecision`'s shapes exactly (mirroring the same
 * decoupling `@workspace/brain` itself uses for `@workspace/event-bus`),
 * and `RuleRegistrar` is the minimal registration capability `Brain`
 * satisfies structurally.
 */

// ---------------------------------------------------------------------------
// Condition DSL
// ---------------------------------------------------------------------------

export type ComparisonOperator = "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "contains";

/**
 * `field` is a dot-path resolved against the evaluation context — e.g.
 * `"payload.taskId"`, `"metadata.userId"`, `"type"`. See `resolveField` in
 * `conditions.ts`.
 */
export type Condition =
  | { op: ComparisonOperator; field: string; value: unknown }
  | { op: "exists"; field: string }
  | { op: "and"; conditions: Condition[] }
  | { op: "or"; conditions: Condition[] }
  | { op: "not"; condition: Condition };

// ---------------------------------------------------------------------------
// Events (as seen by the Rule Engine) — mirrors BrainEvent exactly
// ---------------------------------------------------------------------------

export interface RuleEventMetadata {
  correlationId: string;
  causationId?: string;
  userId?: string;
}

export interface RuleEvent<TPayload = unknown> {
  id: string;
  type: string;
  version: number;
  source: string;
  payload: TPayload;
  metadata: RuleEventMetadata;
  occurredAt: string;
}

// ---------------------------------------------------------------------------
// Action templates
// ---------------------------------------------------------------------------

export type RuleActionKind = "enqueue_task" | "publish_event";

/**
 * What a matched rule produces. Any string value anywhere in `payload`
 * (including nested objects/arrays) that is *exactly* `"{{some.path}}"` —
 * the whole string, not a substring — is replaced with the value resolved
 * from that dot-path against the triggering event; every other string is
 * left as a literal. This is deliberately not a general templating/
 * expression language: whole-token substitution only, so a rule definition
 * can never be used to construct or evaluate arbitrary expressions.
 */
export interface EnqueueTaskTemplate {
  kind: "enqueue_task";
  taskType: string;
  payload: unknown;
  queue?: string;
  priority?: number;
  maxAttempts?: number;
}

export interface PublishEventTemplate {
  kind: "publish_event";
  eventType: string;
  payload: unknown;
}

export type ActionTemplate = EnqueueTaskTemplate | PublishEventTemplate;

// ---------------------------------------------------------------------------
// Rule definitions (durable)
// ---------------------------------------------------------------------------

export interface RuleDefinition {
  id: string;
  name: string;
  description?: string;
  /** Exact event type, a `"namespace.*"` prefix wildcard, or `"*"` — same syntax as `Brain`/`EventBus`. */
  eventPattern: string;
  condition: Condition;
  action: ActionTemplate;
  /** Passed straight through to the `DecisionRule` the Brain arbitrates on. Defaults to 0. */
  priority: number;
  enabled: boolean;
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRuleInput {
  name: string;
  description?: string;
  eventPattern: string;
  condition: Condition;
  action: ActionTemplate;
  priority?: number;
  enabled?: boolean;
  userId?: string;
}

export type UpdateRuleInput = Partial<Omit<CreateRuleInput, "userId">>;

export interface RuleListQuery {
  eventPattern?: string;
  enabled?: boolean;
  userId?: string;
  limit?: number;
}

export interface RuleDefinitionStore {
  insert(rule: RuleDefinition): Promise<RuleDefinition>;
  update(id: string, rule: RuleDefinition): Promise<RuleDefinition | null>;
  delete(id: string): Promise<boolean>;
  getById(id: string): Promise<RuleDefinition | null>;
  list(query: RuleListQuery): Promise<RuleDefinition[]>;
}

// ---------------------------------------------------------------------------
// Brain interop (decoupled — see file doc comment)
// ---------------------------------------------------------------------------

export type Unsubscribe = () => void;

/** What a compiled rule decides — mirrors the actionable half of `RuleDecision` in `@workspace/brain`. */
export type RuleOutcome =
  | { action: "enqueue_task"; reason: string; task: { type: string; payload: unknown; queue?: string; priority?: number; maxAttempts?: number } }
  | { action: "publish_event"; reason: string; event: { type: string; payload: unknown } }
  | { action: "noop"; reason: string };

export interface CompiledRule {
  name: string;
  pattern: string;
  priority: number;
  evaluate(event: RuleEvent): RuleOutcome;
}

/** The minimal registration capability the Rule Engine depends on. `Brain` satisfies this structurally. */
export interface RuleRegistrar {
  registerRule(rule: CompiledRule): Unsubscribe;
}

export interface RuleEngineLogger {
  debug(obj: Record<string, unknown>, msg?: string): void;
  info(obj: Record<string, unknown>, msg?: string): void;
  warn(obj: Record<string, unknown>, msg?: string): void;
  error(obj: Record<string, unknown>, msg?: string): void;
}
