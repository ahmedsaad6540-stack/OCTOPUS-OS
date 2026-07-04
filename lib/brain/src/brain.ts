import { randomUUID } from "node:crypto";
import { DecisionEngine, allMatchStrategy } from "@workspace/decision-engine";
import type { ArbitrationCandidate } from "@workspace/decision-engine";
import type {
  BrainDecision,
  BrainEvent,
  BrainLogger,
  BrainStore,
  DecisionAction,
  DecisionListQuery,
  DecisionOutcome,
  DecisionRule,
  EventPublisher,
  EventSubscriber,
  RuleDecision,
  TaskEnqueuer,
  Unsubscribe,
} from "./types.js";

const noopLogger: BrainLogger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};

/**
 * Every action the Brain takes is itself published as an event (a task's
 * `task.created`, or the decision's own `brain.decision.made`), sourced from
 * `"brain:"` or `"os-core:brain"`. Rules never see events the Brain caused
 * itself — otherwise a rule matching `"*"` or `"brain.*"` would react to its
 * own output and loop forever.
 */
function isSelfAuthored(event: BrainEvent): boolean {
  return event.source === "os-core:brain" || event.source.startsWith("brain:");
}

/** Same pattern syntax as `EventBus.subscribe`: exact type, `"namespace.*"` prefix wildcard, or `"*"` for everything. */
function matchesPattern(pattern: string, type: string): boolean {
  if (pattern === "*") return true;
  if (pattern.endsWith(".*")) return type.startsWith(pattern.slice(0, -1));
  return pattern === type;
}

type ActionableRuleDecision = Extract<NonNullable<RuleDecision>, { action: "enqueue_task" | "publish_event" }>;

interface EvaluatedCandidate {
  rule: DecisionRule;
  decision: ActionableRuleDecision;
}

/**
 * OS Core's decision maker. The Brain never talks to agents or modules
 * directly: every registered `DecisionRule` is evaluated against every
 * event it matches, and — when more than one rule wants to act on the same
 * event — the `DecisionEngine` arbitrates which candidate(s) actually get
 * carried out. Every decision is durable, whether or not it led to an
 * action, so the `brain_decisions` table is always a complete "why did
 * this happen" trail: `noop` (the rule chose not to act), `superseded`
 * (the rule wanted to act but arbitration picked a different candidate),
 * `actioned`, or `action_failed`.
 */
export class Brain {
  private readonly rules: DecisionRule[] = [];
  private readonly ruleNames = new Set<string>();
  private unsubscribeDispatch: Unsubscribe | null = null;

  constructor(
    private readonly store: BrainStore,
    private readonly eventBus: EventSubscriber & EventPublisher,
    private readonly taskQueue: TaskEnqueuer,
    private readonly logger: BrainLogger = noopLogger,
    private readonly decisionEngine: DecisionEngine = new DecisionEngine(allMatchStrategy),
  ) {}

  /**
   * Register a decision rule. Throws if a rule with the same name is
   * already registered — rule names are the audit trail's attribution and
   * the Decision Engine's candidate key, so they must stay unique and
   * stable. Lazily subscribes one dispatcher to the Event Bus on the first
   * call, regardless of how many distinct rule patterns are registered —
   * every event is matched against every rule's own pattern locally, so
   * arbitration always sees every rule that's interested in a given event,
   * not just the ones sharing its subscription.
   */
  registerRule(rule: DecisionRule): Unsubscribe {
    if (this.ruleNames.has(rule.name)) {
      throw new Error(`Rule "${rule.name}" is already registered`);
    }
    this.ruleNames.add(rule.name);
    this.rules.push(rule);

    if (!this.unsubscribeDispatch) {
      this.unsubscribeDispatch = this.eventBus.subscribe("*", "os-core:brain-dispatch", (event) =>
        this.dispatch(event as BrainEvent),
      );
    }

    return () => {
      const idx = this.rules.indexOf(rule);
      if (idx >= 0) this.rules.splice(idx, 1);
      this.ruleNames.delete(rule.name);
    };
  }

  async getDecision(id: string): Promise<BrainDecision | null> {
    return this.store.getById(id);
  }

  async listDecisions(query: DecisionListQuery = {}): Promise<BrainDecision[]> {
    return this.store.list(query);
  }

  /**
   * The single Event Bus subscription behind every registered rule.
   * Evaluates every rule whose pattern matches this event, records and
   * bypasses the ones that declined (`noop`) or threw (`action_failed`),
   * arbitrates the rest through the `DecisionEngine`, carries out the
   * winner(s), and records a `superseded` decision for every actionable
   * candidate that lost arbitration.
   */
  private async dispatch(event: BrainEvent): Promise<void> {
    if (isSelfAuthored(event)) return;

    const matching = this.rules.filter((rule) => matchesPattern(rule.pattern, event.type));
    if (matching.length === 0) return;

    const actionable: EvaluatedCandidate[] = [];

    for (const rule of matching) {
      let ruleDecision: RuleDecision;
      try {
        ruleDecision = await rule.evaluate(event);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        await this.recordAndPublish(rule.name, event, "noop", "rule evaluation threw", null, "action_failed", {
          error: message,
        });
        this.logger.error({ rule: rule.name, eventId: event.id, error: message }, "brain.rule_failed");
        continue;
      }

      if (!ruleDecision || ruleDecision.action === "noop") {
        const reason = ruleDecision?.reason ?? "rule declined to act";
        await this.recordAndPublish(rule.name, event, "noop", reason, null, "noop", null);
        continue;
      }

      actionable.push({ rule, decision: ruleDecision });
    }

    if (actionable.length === 0) return;

    const candidates: ArbitrationCandidate[] = actionable.map(({ rule, decision }) => ({
      ruleName: rule.name,
      action: decision.action,
      priority: rule.priority ?? 0,
      reason: decision.reason,
      decision,
    }));
    const winners = new Set(this.decisionEngine.arbitrate(candidates).map((c) => c.ruleName));

    for (const { rule, decision } of actionable) {
      if (!winners.has(rule.name)) {
        await this.recordAndPublish(
          rule.name,
          event,
          decision.action,
          decision.reason,
          decision.action === "enqueue_task" ? decision.task : decision.event,
          "superseded",
          { strategy: this.decisionEngine.strategyName },
        );
        continue;
      }

      if (decision.action === "enqueue_task") {
        await this.act(rule.name, event, "enqueue_task", decision.reason, decision.task, () =>
          this.taskQueue.enqueue(decision.task.type, `brain:${rule.name}`, decision.task.payload, {
            ...(decision.task.queue !== undefined ? { queue: decision.task.queue } : {}),
            ...(decision.task.priority !== undefined ? { priority: decision.task.priority } : {}),
            ...(decision.task.maxAttempts !== undefined ? { maxAttempts: decision.task.maxAttempts } : {}),
            correlationId: event.metadata.correlationId,
            causationId: event.id,
            ...(event.metadata.userId ? { userId: event.metadata.userId } : {}),
          }).then((task) => ({ taskId: task.id })),
        );
      } else {
        await this.act(rule.name, event, "publish_event", decision.reason, decision.event, () =>
          this.eventBus
            .publish(decision.event.type, `brain:${rule.name}`, decision.event.payload, {
              correlationId: event.metadata.correlationId,
              causationId: event.id,
              ...(event.metadata.userId ? { userId: event.metadata.userId } : {}),
            })
            .then((published) => ({ published })),
        );
      }
    }
  }

  private async act(
    ruleName: string,
    event: BrainEvent,
    action: DecisionAction,
    reason: string,
    actionPayload: unknown,
    perform: () => Promise<unknown>,
  ): Promise<void> {
    try {
      const outcomeDetail = await perform();
      await this.recordAndPublish(ruleName, event, action, reason, actionPayload, "actioned", outcomeDetail);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await this.recordAndPublish(ruleName, event, action, reason, actionPayload, "action_failed", {
        error: message,
      });
      this.logger.error({ rule: ruleName, eventId: event.id, action, error: message }, "brain.action_failed");
    }
  }

  private async recordAndPublish(
    ruleName: string,
    event: BrainEvent,
    action: DecisionAction,
    reason: string,
    actionPayload: unknown,
    outcome: DecisionOutcome,
    outcomeDetail: unknown,
  ): Promise<BrainDecision> {
    const decision: BrainDecision = {
      id: randomUUID(),
      ruleName,
      eventId: event.id,
      eventType: event.type,
      action,
      reason,
      actionPayload,
      outcome,
      outcomeDetail,
      correlationId: event.metadata.correlationId,
      ...(event.metadata.causationId ? { causationId: event.metadata.causationId } : {}),
      ...(event.metadata.userId ? { userId: event.metadata.userId } : {}),
      createdAt: new Date().toISOString(),
    };

    const stored = await this.store.insert(decision);

    this.logger.info(
      { decisionId: stored.id, rule: ruleName, eventType: event.type, action, outcome },
      "brain.decision.made",
    );

    // Best-effort: a decision is already durably recorded even if this
    // publish fails, so a broadcast failure never loses the decision itself.
    try {
      await this.eventBus.publish("brain.decision.made", "os-core:brain", stored, {
        correlationId: stored.correlationId,
        causationId: stored.eventId,
        ...(stored.userId ? { userId: stored.userId } : {}),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error({ decisionId: stored.id, error: message }, "brain.broadcast_failed");
    }

    return stored;
  }
}
