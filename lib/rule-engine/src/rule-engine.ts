import { randomUUID } from "node:crypto";
import { evaluateCondition } from "./conditions.js";
import { renderTemplate } from "./template.js";
import type {
  ActionTemplate,
  CompiledRule,
  CreateRuleInput,
  RuleDefinition,
  RuleDefinitionStore,
  RuleEngineLogger,
  RuleEvent,
  RuleListQuery,
  RuleOutcome,
  RuleRegistrar,
  Unsubscribe,
  UpdateRuleInput,
} from "./types.js";

const noopLogger: RuleEngineLogger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};

function toOutcome(action: ActionTemplate, event: RuleEvent): RuleOutcome {
  const payload = renderTemplate(action.payload, event);
  if (action.kind === "enqueue_task") {
    return {
      action: "enqueue_task",
      reason: `rule condition matched`,
      task: {
        type: action.taskType,
        payload,
        ...(action.queue !== undefined ? { queue: action.queue } : {}),
        ...(action.priority !== undefined ? { priority: action.priority } : {}),
        ...(action.maxAttempts !== undefined ? { maxAttempts: action.maxAttempts } : {}),
      },
    };
  }
  return {
    action: "publish_event",
    reason: `rule condition matched`,
    event: { type: action.eventType, payload },
  };
}

/** Turns a durable `RuleDefinition` into a `CompiledRule` the Brain can register. Pure — no I/O, no side effects, safe to call as often as needed. */
export function compileRule(definition: RuleDefinition): CompiledRule {
  return {
    name: `rule-engine:${definition.id}`,
    pattern: definition.eventPattern,
    priority: definition.priority,
    evaluate(event: RuleEvent): RuleOutcome {
      if (!evaluateCondition(definition.condition, event)) {
        return { action: "noop", reason: "condition did not match" };
      }
      return toOutcome(definition.action, event);
    },
  };
}

/**
 * Data-driven rules on top of the Brain: create/update/enable/disable/
 * delete a `RuleDefinition` through `RuleEngine`, and it keeps a running
 * Brain's registered rules in sync automatically — no restart required.
 * The Rule Engine owns rule *definitions* only; every decision a compiled
 * rule leads to is still recorded by the Brain itself in `brain_decisions`,
 * attributed to `rule-engine:<id>`.
 */
export class RuleEngine {
  private readonly registrations = new Map<string, Unsubscribe>();

  constructor(
    private readonly store: RuleDefinitionStore,
    private readonly registrar: RuleRegistrar,
    private readonly logger: RuleEngineLogger = noopLogger,
  ) {}

  /** Loads every enabled rule definition from the store and registers it against the Brain. Call once at process startup, after any code-defined core rules are registered. */
  async loadAndSync(): Promise<void> {
    const rules = await this.store.list({ enabled: true });
    for (const rule of rules) {
      this.register(rule);
    }
    this.logger.info({ count: rules.length }, "rule_engine.loaded");
  }

  async create(input: CreateRuleInput): Promise<RuleDefinition> {
    const now = new Date().toISOString();
    const rule: RuleDefinition = {
      id: randomUUID(),
      name: input.name,
      ...(input.description !== undefined ? { description: input.description } : {}),
      eventPattern: input.eventPattern,
      condition: input.condition,
      action: input.action,
      priority: input.priority ?? 0,
      enabled: input.enabled ?? true,
      ...(input.userId ? { userId: input.userId } : {}),
      createdAt: now,
      updatedAt: now,
    };
    const stored = await this.store.insert(rule);
    if (stored.enabled) this.register(stored);
    return stored;
  }

  async update(id: string, input: UpdateRuleInput): Promise<RuleDefinition | null> {
    const existing = await this.store.getById(id);
    if (!existing) return null;

    const updated: RuleDefinition = {
      ...existing,
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.eventPattern !== undefined ? { eventPattern: input.eventPattern } : {}),
      ...(input.condition !== undefined ? { condition: input.condition } : {}),
      ...(input.action !== undefined ? { action: input.action } : {}),
      ...(input.priority !== undefined ? { priority: input.priority } : {}),
      ...(input.enabled !== undefined ? { enabled: input.enabled } : {}),
      updatedAt: new Date().toISOString(),
    };

    const stored = await this.store.update(id, updated);
    if (!stored) return null;

    // Always re-register from scratch: the pattern, condition, action, or
    // priority may have changed, and `Brain` has no "update a registered
    // rule in place" operation — only register/unregister.
    this.unregister(id);
    if (stored.enabled) this.register(stored);
    return stored;
  }

  async delete(id: string): Promise<boolean> {
    this.unregister(id);
    return this.store.delete(id);
  }

  async enable(id: string): Promise<RuleDefinition | null> {
    return this.update(id, { enabled: true });
  }

  async disable(id: string): Promise<RuleDefinition | null> {
    return this.update(id, { enabled: false });
  }

  async get(id: string): Promise<RuleDefinition | null> {
    return this.store.getById(id);
  }

  async list(query: RuleListQuery = {}): Promise<RuleDefinition[]> {
    return this.store.list(query);
  }

  private register(rule: RuleDefinition): void {
    if (this.registrations.has(rule.id)) return;
    const unsubscribe = this.registrar.registerRule(compileRule(rule));
    this.registrations.set(rule.id, unsubscribe);
    this.logger.info({ ruleId: rule.id, name: rule.name, pattern: rule.eventPattern }, "rule_engine.registered");
  }

  private unregister(id: string): void {
    const unsubscribe = this.registrations.get(id);
    if (!unsubscribe) return;
    unsubscribe();
    this.registrations.delete(id);
    this.logger.info({ ruleId: id }, "rule_engine.unregistered");
  }
}
