import { randomUUID } from "node:crypto";
import type {
  AgentDefinition,
  AgentDefinitionStore,
  AgentExecutor,
  AgentListQuery,
  AgentManagerLogger,
  AgentRun,
  AgentRunListQuery,
  AgentRunStore,
  CreateAgentInput,
  UpdateAgentInput,
} from "./types.js";

const noopLogger: AgentManagerLogger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};

/** Thrown by `invoke()` when no `AgentExecutor` has been configured. A distinct, catchable error type so callers (e.g. an HTTP route) can distinguish "not wired up yet" from an executor actually failing. */
export class AgentExecutorNotConfiguredError extends Error {
  constructor() {
    super("No AgentExecutor is configured — nothing can run this agent yet");
    this.name = "AgentExecutorNotConfiguredError";
  }
}

/** Thrown by `invoke()` when the agent doesn't exist or is disabled. */
export class AgentNotInvocableError extends Error {
  constructor(reason: string) {
    super(reason);
    this.name = "AgentNotInvocableError";
  }
}

/**
 * Registry, lifecycle, and durable run history for agents. Creating,
 * updating, disabling, or deleting an agent here never touches the Brain,
 * the Task Queue, or the Event Bus directly — an agent is invoked either
 * synchronously via `invoke()` (used by `POST /api/agents/:id/invoke`) or,
 * once the Workflow Engine/Scheduler exist, by something enqueuing a task
 * that a future agent worker claims. Either path runs through the same
 * `AgentExecutor` and produces the same kind of durable `AgentRun`.
 */
export class AgentManager {
  constructor(
    private readonly agentStore: AgentDefinitionStore,
    private readonly runStore: AgentRunStore,
    private readonly logger: AgentManagerLogger = noopLogger,
    private readonly executor?: AgentExecutor,
  ) {}

  async create(input: CreateAgentInput): Promise<AgentDefinition> {
    const now = new Date().toISOString();
    const agent: AgentDefinition = {
      id: randomUUID(),
      name: input.name,
      ...(input.description !== undefined ? { description: input.description } : {}),
      instructions: input.instructions,
      capabilities: input.capabilities ?? [],
      status: input.status ?? "active",
      ...(input.userId ? { userId: input.userId } : {}),
      createdAt: now,
      updatedAt: now,
    };
    return this.agentStore.insert(agent);
  }

  async update(id: string, input: UpdateAgentInput): Promise<AgentDefinition | null> {
    const existing = await this.agentStore.getById(id);
    if (!existing) return null;

    const updated: AgentDefinition = {
      ...existing,
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.instructions !== undefined ? { instructions: input.instructions } : {}),
      ...(input.capabilities !== undefined ? { capabilities: input.capabilities } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      updatedAt: new Date().toISOString(),
    };
    return this.agentStore.update(id, updated);
  }

  async delete(id: string): Promise<boolean> {
    return this.agentStore.delete(id);
  }

  async enable(id: string): Promise<AgentDefinition | null> {
    return this.update(id, { status: "active" });
  }

  async disable(id: string): Promise<AgentDefinition | null> {
    return this.update(id, { status: "disabled" });
  }

  async get(id: string): Promise<AgentDefinition | null> {
    return this.agentStore.getById(id);
  }

  async list(query: AgentListQuery = {}): Promise<AgentDefinition[]> {
    return this.agentStore.list(query);
  }

  /**
   * Runs an agent synchronously against `input` through the configured
   * `AgentExecutor`, recording a durable `AgentRun` regardless of outcome.
   * Throws `AgentNotInvocableError` if the agent doesn't exist or is
   * disabled, and `AgentExecutorNotConfiguredError` if no executor is
   * configured — neither of those produces an `AgentRun`, since nothing
   * was actually attempted. Once execution starts, success or failure is
   * always recorded.
   */
  async invoke(agentId: string, input: unknown, userId?: string): Promise<AgentRun> {
    const agent = await this.agentStore.getById(agentId);
    if (!agent) throw new AgentNotInvocableError(`Agent "${agentId}" does not exist`);
    if (agent.status !== "active") throw new AgentNotInvocableError(`Agent "${agentId}" is disabled`);
    if (!this.executor) throw new AgentExecutorNotConfiguredError();

    const startedAt = new Date().toISOString();
    const run: AgentRun = {
      id: randomUUID(),
      agentId,
      status: "running",
      input,
      output: null,
      error: null,
      ...(userId ? { userId } : {}),
      startedAt,
      completedAt: null,
    };
    let stored = await this.runStore.insert(run);
    this.logger.info({ runId: stored.id, agentId }, "agent_manager.run_started");

    try {
      const output = await this.executor.execute(agent, input);
      const completed: AgentRun = { ...stored, status: "completed", output, completedAt: new Date().toISOString() };
      stored = (await this.runStore.update(stored.id, completed)) ?? completed;
      this.logger.info({ runId: stored.id, agentId }, "agent_manager.run_completed");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const failed: AgentRun = { ...stored, status: "failed", error: message, completedAt: new Date().toISOString() };
      stored = (await this.runStore.update(stored.id, failed)) ?? failed;
      this.logger.error({ runId: stored.id, agentId, error: message }, "agent_manager.run_failed");
    }

    return stored;
  }

  async getRun(id: string): Promise<AgentRun | null> {
    return this.runStore.getById(id);
  }

  async listRuns(query: AgentRunListQuery = {}): Promise<AgentRun[]> {
    return this.runStore.list(query);
  }
}
