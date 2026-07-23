import type { BrainDecision, BrainStore, DecisionListQuery } from "./types.js";

/**
 * In-memory decision store for unit tests and local scripts that don't want
 * a database dependency. Never used in production — the api-server always
 * wires up `DrizzleBrainStore`. Mirrors `InMemoryTaskStore` in
 * `@workspace/task-queue` and `InMemoryEventStore` in `@workspace/event-bus`.
 *
 * Deliberately kept free of any Postgres/Drizzle imports (unlike
 * `drizzle-store.ts`) so it — and everything built on it — can be exercised
 * in environments with no database and no installed dependencies at all.
 */
export class InMemoryBrainStore implements BrainStore {
  private readonly decisions = new Map<string, BrainDecision>();

  async insert(decision: BrainDecision): Promise<BrainDecision> {
    this.decisions.set(decision.id, { ...decision });
    return { ...decision };
  }

  async getById(id: string): Promise<BrainDecision | null> {
    const decision = this.decisions.get(id);
    return decision ? { ...decision } : null;
  }

  async list(query: DecisionListQuery): Promise<BrainDecision[]> {
    let results = Array.from(this.decisions.values());
    if (query.ruleName) results = results.filter((d) => d.ruleName === query.ruleName);
    if (query.eventType) results = results.filter((d) => d.eventType === query.eventType);
    if (query.outcome) results = results.filter((d) => d.outcome === query.outcome);
    if (query.correlationId) {
      results = results.filter((d) => d.correlationId === query.correlationId);
    }
    if (query.userId) results = results.filter((d) => d.userId === query.userId);
    results.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    const safeLimit =
      typeof query.limit === "number" && Number.isFinite(query.limit) ? query.limit : 50;
    return results.slice(0, Math.min(Math.max(safeLimit, 1), 200)).map((d) => ({ ...d }));
  }
}
