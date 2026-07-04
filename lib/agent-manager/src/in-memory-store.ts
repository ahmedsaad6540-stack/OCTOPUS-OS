import type {
  AgentDefinition,
  AgentDefinitionStore,
  AgentListQuery,
  AgentRun,
  AgentRunListQuery,
  AgentRunStore,
} from "./types.js";

/** In-memory agent definition store for unit tests and local scripts. The api-server always wires up `DrizzleAgentStore`. */
export class InMemoryAgentStore implements AgentDefinitionStore {
  private readonly agents = new Map<string, AgentDefinition>();

  async insert(agent: AgentDefinition): Promise<AgentDefinition> {
    this.agents.set(agent.id, { ...agent });
    return { ...agent };
  }

  async update(id: string, agent: AgentDefinition): Promise<AgentDefinition | null> {
    if (!this.agents.has(id)) return null;
    this.agents.set(id, { ...agent });
    return { ...agent };
  }

  async delete(id: string): Promise<boolean> {
    return this.agents.delete(id);
  }

  async getById(id: string): Promise<AgentDefinition | null> {
    const agent = this.agents.get(id);
    return agent ? { ...agent } : null;
  }

  async list(query: AgentListQuery): Promise<AgentDefinition[]> {
    let results = Array.from(this.agents.values());
    if (query.status) results = results.filter((a) => a.status === query.status);
    if (query.userId) results = results.filter((a) => a.userId === query.userId);
    results.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    const safeLimit = typeof query.limit === "number" && Number.isFinite(query.limit) ? query.limit : 100;
    return results.slice(0, Math.min(Math.max(safeLimit, 1), 500)).map((a) => ({ ...a }));
  }
}

/** In-memory agent run store for unit tests and local scripts. The api-server always wires up `DrizzleAgentRunStore`. */
export class InMemoryAgentRunStore implements AgentRunStore {
  private readonly runs = new Map<string, AgentRun>();

  async insert(run: AgentRun): Promise<AgentRun> {
    this.runs.set(run.id, { ...run });
    return { ...run };
  }

  async update(id: string, run: AgentRun): Promise<AgentRun | null> {
    if (!this.runs.has(id)) return null;
    this.runs.set(id, { ...run });
    return { ...run };
  }

  async getById(id: string): Promise<AgentRun | null> {
    const run = this.runs.get(id);
    return run ? { ...run } : null;
  }

  async list(query: AgentRunListQuery): Promise<AgentRun[]> {
    let results = Array.from(this.runs.values());
    if (query.agentId) results = results.filter((r) => r.agentId === query.agentId);
    if (query.status) results = results.filter((r) => r.status === query.status);
    if (query.userId) results = results.filter((r) => r.userId === query.userId);
    results.sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1));
    const safeLimit = typeof query.limit === "number" && Number.isFinite(query.limit) ? query.limit : 100;
    return results.slice(0, Math.min(Math.max(safeLimit, 1), 500)).map((r) => ({ ...r }));
  }
}
