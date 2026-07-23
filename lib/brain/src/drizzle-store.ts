import { and, desc, eq } from "drizzle-orm";
import { brainDecisionsTable, type BrainDecisionRecord } from "@workspace/db/schema";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { BrainDecision, BrainStore, DecisionListQuery } from "./types.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = NodePgDatabase<any>;

function toBrainDecision(record: BrainDecisionRecord): BrainDecision {
  return {
    id: record.id,
    ruleName: record.ruleName,
    eventId: record.eventId,
    eventType: record.eventType,
    action: record.action as BrainDecision["action"],
    reason: record.reason,
    actionPayload: record.actionPayload,
    outcome: record.outcome as BrainDecision["outcome"],
    outcomeDetail: record.outcomeDetail,
    correlationId: record.correlationId,
    ...(record.causationId ? { causationId: record.causationId } : {}),
    ...(record.userId ? { userId: record.userId } : {}),
    createdAt: record.createdAt.toISOString(),
  };
}

/**
 * Production decision store, backed by the `brain_decisions` table in
 * Postgres. Every decision the Brain makes — actioned or not — is durably
 * recorded here, cross-referenced by `eventId`/`correlationId` with the
 * Event Bus's own `events` table.
 */
export class DrizzleBrainStore implements BrainStore {
  constructor(private readonly db: Db) {}

  async insert(decision: BrainDecision): Promise<BrainDecision> {
    await this.db.insert(brainDecisionsTable).values({
      id: decision.id,
      ruleName: decision.ruleName,
      eventId: decision.eventId,
      eventType: decision.eventType,
      action: decision.action,
      reason: decision.reason,
      actionPayload: decision.actionPayload ?? null,
      outcome: decision.outcome,
      outcomeDetail: decision.outcomeDetail ?? null,
      correlationId: decision.correlationId,
      causationId: decision.causationId ?? null,
      userId: decision.userId ?? null,
      createdAt: new Date(decision.createdAt),
    });
    return decision;
  }

  async getById(id: string): Promise<BrainDecision | null> {
    const rows = await this.db
      .select()
      .from(brainDecisionsTable)
      .where(eq(brainDecisionsTable.id, id))
      .limit(1);

    return rows[0] ? toBrainDecision(rows[0]) : null;
  }

  async list(query: DecisionListQuery): Promise<BrainDecision[]> {
    const conditions = [];
    if (query.ruleName) conditions.push(eq(brainDecisionsTable.ruleName, query.ruleName));
    if (query.eventType) conditions.push(eq(brainDecisionsTable.eventType, query.eventType));
    if (query.outcome) conditions.push(eq(brainDecisionsTable.outcome, query.outcome));
    if (query.correlationId) {
      conditions.push(eq(brainDecisionsTable.correlationId, query.correlationId));
    }
    if (query.userId) conditions.push(eq(brainDecisionsTable.userId, query.userId));

    const rawLimit = query.limit;
    const safeLimit = typeof rawLimit === "number" && Number.isFinite(rawLimit) ? rawLimit : 50;

    const rows = await this.db
      .select()
      .from(brainDecisionsTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(brainDecisionsTable.createdAt))
      .limit(Math.min(Math.max(safeLimit, 1), 200));

    return rows.map(toBrainDecision);
  }
}
