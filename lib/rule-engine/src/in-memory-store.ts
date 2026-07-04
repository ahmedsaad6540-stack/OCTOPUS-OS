import type { RuleDefinition, RuleDefinitionStore, RuleListQuery } from "./types.js";

/**
 * In-memory rule definition store for unit tests and local scripts. Never
 * used in production — the api-server always wires up
 * `DrizzleRuleDefinitionStore`. Mirrors `InMemoryBrainStore` in
 * `@workspace/brain`.
 */
export class InMemoryRuleDefinitionStore implements RuleDefinitionStore {
  private readonly rules = new Map<string, RuleDefinition>();

  async insert(rule: RuleDefinition): Promise<RuleDefinition> {
    this.rules.set(rule.id, { ...rule });
    return { ...rule };
  }

  async update(id: string, rule: RuleDefinition): Promise<RuleDefinition | null> {
    if (!this.rules.has(id)) return null;
    this.rules.set(id, { ...rule });
    return { ...rule };
  }

  async delete(id: string): Promise<boolean> {
    return this.rules.delete(id);
  }

  async getById(id: string): Promise<RuleDefinition | null> {
    const rule = this.rules.get(id);
    return rule ? { ...rule } : null;
  }

  async list(query: RuleListQuery): Promise<RuleDefinition[]> {
    let results = Array.from(this.rules.values());
    if (query.eventPattern) results = results.filter((r) => r.eventPattern === query.eventPattern);
    if (query.enabled !== undefined) results = results.filter((r) => r.enabled === query.enabled);
    if (query.userId) results = results.filter((r) => r.userId === query.userId);
    results.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    const safeLimit = typeof query.limit === "number" && Number.isFinite(query.limit) ? query.limit : 100;
    return results.slice(0, Math.min(Math.max(safeLimit, 1), 500)).map((r) => ({ ...r }));
  }
}
