import { and, desc, eq } from "drizzle-orm";
import { agentsTable, agentRunsTable, type AgentRecord, type AgentRunRecord } from "@workspace/db/schema";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type {
  AgentDefinition,
  AgentDefinitionStore,
  AgentListQuery,
  AgentRun,
  AgentRunListQuery,
  AgentRunStore,
  AgentStatus,
} from "./types.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = NodePgDatabase<any>;

function toAgent(record: AgentRecord): AgentDefinition {
  return {
    id: record.id,
    name: record.name,
    ...(record.description ? { description: record.description } : {}),
    instructions: record.instructions,
    capabilities: (record.capabilities as string[] | null) ?? [],
    status: record.status as AgentStatus,
    ...(record.userId ? { userId: record.userId } : {}),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export class DrizzleAgentStore implements AgentDefinitionStore {
  constructor(private readonly db: Db) {}

  async insert(agent: AgentDefinition): Promise<AgentDefinition> {
    await this.db.insert(agentsTable).values({
      id: agent.id,
      name: agent.name,
      description: agent.description ?? null,
      instructions: agent.instructions,
      capabilities: agent.capabilities,
      status: agent.status,
      userId: agent.userId ?? null,
      createdAt: new Date(agent.createdAt),
      updatedAt: new Date(agent.updatedAt),
    });
    return agent;
  }

  async update(id: string, agent: AgentDefinition): Promise<AgentDefinition | null> {
    const rows = await this.db
      .update(agentsTable)
      .set({
        name: agent.name,
        description: agent.description ?? null,
        instructions: agent.instructions,
        capabilities: agent.capabilities,
        status: agent.status,
        updatedAt: new Date(agent.updatedAt),
      })
      .where(eq(agentsTable.id, id))
      .returning();
    return rows[0] ? toAgent(rows[0]) : null;
  }

  async delete(id: string): Promise<boolean> {
    const rows = await this.db.delete(agentsTable).where(eq(agentsTable.id, id)).returning();
    return rows.length > 0;
  }

  async getById(id: string): Promise<AgentDefinition | null> {
    const rows = await this.db.select().from(agentsTable).where(eq(agentsTable.id, id)).limit(1);
    return rows[0] ? toAgent(rows[0]) : null;
  }

  async list(query: AgentListQuery): Promise<AgentDefinition[]> {
    const conditions = [];
    if (query.status) conditions.push(eq(agentsTable.status, query.status));
    if (query.userId) conditions.push(eq(agentsTable.userId, query.userId));

    const rawLimit = query.limit;
    const safeLimit = typeof rawLimit === "number" && Number.isFinite(rawLimit) ? rawLimit : 100;

    const rows = await this.db
      .select()
      .from(agentsTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(agentsTable.createdAt))
      .limit(Math.min(Math.max(safeLimit, 1), 500));

    return rows.map(toAgent);
  }
}

function toAgentRun(record: AgentRunRecord): AgentRun {
  return {
    id: record.id,
    agentId: record.agentId,
    status: record.status as AgentRun["status"],
    input: record.input,
    output: record.output,
    error: record.error,
    ...(record.userId ? { userId: record.userId } : {}),
    startedAt: record.startedAt.toISOString(),
    completedAt: record.completedAt ? record.completedAt.toISOString() : null,
  };
}

export class DrizzleAgentRunStore implements AgentRunStore {
  constructor(private readonly db: Db) {}

  async insert(run: AgentRun): Promise<AgentRun> {
    await this.db.insert(agentRunsTable).values({
      id: run.id,
      agentId: run.agentId,
      status: run.status,
      input: run.input ?? null,
      output: run.output ?? null,
      error: run.error,
      userId: run.userId ?? null,
      startedAt: new Date(run.startedAt),
      completedAt: run.completedAt ? new Date(run.completedAt) : null,
    });
    return run;
  }

  async update(id: string, run: AgentRun): Promise<AgentRun | null> {
    const rows = await this.db
      .update(agentRunsTable)
      .set({
        status: run.status,
        output: run.output ?? null,
        error: run.error,
        completedAt: run.completedAt ? new Date(run.completedAt) : null,
      })
      .where(eq(agentRunsTable.id, id))
      .returning();
    return rows[0] ? toAgentRun(rows[0]) : null;
  }

  async getById(id: string): Promise<AgentRun | null> {
    const rows = await this.db.select().from(agentRunsTable).where(eq(agentRunsTable.id, id)).limit(1);
    return rows[0] ? toAgentRun(rows[0]) : null;
  }

  async list(query: AgentRunListQuery): Promise<AgentRun[]> {
    const conditions = [];
    if (query.agentId) conditions.push(eq(agentRunsTable.agentId, query.agentId));
    if (query.status) conditions.push(eq(agentRunsTable.status, query.status));
    if (query.userId) conditions.push(eq(agentRunsTable.userId, query.userId));

    const rawLimit = query.limit;
    const safeLimit = typeof rawLimit === "number" && Number.isFinite(rawLimit) ? rawLimit : 100;

    const rows = await this.db
      .select()
      .from(agentRunsTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(agentRunsTable.startedAt))
      .limit(Math.min(Math.max(safeLimit, 1), 500));

    return rows.map(toAgentRun);
  }
}
