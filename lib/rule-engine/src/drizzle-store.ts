import { and, desc, eq } from "drizzle-orm";
import { ruleDefinitionsTable, type RuleDefinitionRecord } from "@workspace/db/schema";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { Condition, ActionTemplate, RuleDefinition, RuleDefinitionStore, RuleListQuery } from "./types.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = NodePgDatabase<any>;

function toRuleDefinition(record: RuleDefinitionRecord): RuleDefinition {
  return {
    id: record.id,
    name: record.name,
    ...(record.description ? { description: record.description } : {}),
    eventPattern: record.eventPattern,
    condition: record.condition as Condition,
    action: record.action as ActionTemplate,
    priority: record.priority,
    enabled: record.enabled,
    ...(record.userId ? { userId: record.userId } : {}),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

/** Production rule definition store, backed by the `rule_definitions` table in Postgres. */
export class DrizzleRuleDefinitionStore implements RuleDefinitionStore {
  constructor(private readonly db: Db) {}

  async insert(rule: RuleDefinition): Promise<RuleDefinition> {
    await this.db.insert(ruleDefinitionsTable).values({
      id: rule.id,
      name: rule.name,
      description: rule.description ?? null,
      eventPattern: rule.eventPattern,
      condition: rule.condition,
      action: rule.action,
      priority: rule.priority,
      enabled: rule.enabled,
      userId: rule.userId ?? null,
      createdAt: new Date(rule.createdAt),
      updatedAt: new Date(rule.updatedAt),
    });
    return rule;
  }

  async update(id: string, rule: RuleDefinition): Promise<RuleDefinition | null> {
    const rows = await this.db
      .update(ruleDefinitionsTable)
      .set({
        name: rule.name,
        description: rule.description ?? null,
        eventPattern: rule.eventPattern,
        condition: rule.condition,
        action: rule.action,
        priority: rule.priority,
        enabled: rule.enabled,
        updatedAt: new Date(rule.updatedAt),
      })
      .where(eq(ruleDefinitionsTable.id, id))
      .returning();
    return rows[0] ? toRuleDefinition(rows[0]) : null;
  }

  async delete(id: string): Promise<boolean> {
    const rows = await this.db.delete(ruleDefinitionsTable).where(eq(ruleDefinitionsTable.id, id)).returning();
    return rows.length > 0;
  }

  async getById(id: string): Promise<RuleDefinition | null> {
    const rows = await this.db.select().from(ruleDefinitionsTable).where(eq(ruleDefinitionsTable.id, id)).limit(1);
    return rows[0] ? toRuleDefinition(rows[0]) : null;
  }

  async list(query: RuleListQuery): Promise<RuleDefinition[]> {
    const conditions = [];
    if (query.eventPattern) conditions.push(eq(ruleDefinitionsTable.eventPattern, query.eventPattern));
    if (query.enabled !== undefined) conditions.push(eq(ruleDefinitionsTable.enabled, query.enabled));
    if (query.userId) conditions.push(eq(ruleDefinitionsTable.userId, query.userId));

    const rawLimit = query.limit;
    const safeLimit = typeof rawLimit === "number" && Number.isFinite(rawLimit) ? rawLimit : 100;

    const rows = await this.db
      .select()
      .from(ruleDefinitionsTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(ruleDefinitionsTable.createdAt))
      .limit(Math.min(Math.max(safeLimit, 1), 500));

    return rows.map(toRuleDefinition);
  }
}
