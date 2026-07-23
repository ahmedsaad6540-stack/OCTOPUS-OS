/**
 * The Agent Manager owns agent *registration and lifecycle*, and the
 * durable record of every time an agent ran — it deliberately does not
 * know how to actually run one. `AgentExecutor` is the extension point:
 * the AI Provider Manager (next in the roadmap) is what will supply a real
 * implementation that turns an `AgentDefinition` + input into a model call.
 * Until then, `AgentManager.invoke()` fails loudly and explicitly
 * (`AgentExecutorNotConfiguredError`) rather than faking a response —
 * an agent with no executor configured is a real, reportable state, not
 * something to paper over.
 */

// ---------------------------------------------------------------------------
// Agent definitions
// ---------------------------------------------------------------------------

export type AgentStatus = "active" | "disabled";

export interface AgentDefinition {
  id: string;
  name: string;
  description?: string;
  /** System prompt / operating instructions for whatever executes this agent. */
  instructions: string;
  /** Names of tools/capabilities this agent may use. Not resolved or validated here — the Tool Manager owns what a capability name actually means. */
  capabilities: string[];
  status: AgentStatus;
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAgentInput {
  name: string;
  description?: string;
  instructions: string;
  capabilities?: string[];
  status?: AgentStatus;
  userId?: string;
}

export type UpdateAgentInput = Partial<Omit<CreateAgentInput, "userId">>;

export interface AgentListQuery {
  status?: AgentStatus;
  userId?: string;
  limit?: number;
}

export interface AgentDefinitionStore {
  insert(agent: AgentDefinition): Promise<AgentDefinition>;
  update(id: string, agent: AgentDefinition): Promise<AgentDefinition | null>;
  delete(id: string): Promise<boolean>;
  getById(id: string): Promise<AgentDefinition | null>;
  list(query: AgentListQuery): Promise<AgentDefinition[]>;
}

// ---------------------------------------------------------------------------
// Agent runs (durable execution record)
// ---------------------------------------------------------------------------

export type AgentRunStatus = "running" | "completed" | "failed";

export interface AgentRun {
  id: string;
  agentId: string;
  status: AgentRunStatus;
  input: unknown;
  output: unknown;
  error: string | null;
  userId?: string;
  startedAt: string;
  completedAt: string | null;
}

export interface AgentRunListQuery {
  agentId?: string;
  status?: AgentRunStatus;
  userId?: string;
  limit?: number;
}

export interface AgentRunStore {
  insert(run: AgentRun): Promise<AgentRun>;
  update(id: string, run: AgentRun): Promise<AgentRun | null>;
  getById(id: string): Promise<AgentRun | null>;
  list(query: AgentRunListQuery): Promise<AgentRun[]>;
}

// ---------------------------------------------------------------------------
// Execution (extension point — fulfilled by the AI Provider Manager)
// ---------------------------------------------------------------------------

/**
 * Turns an `AgentDefinition` and an input into an output. Must throw on
 * failure rather than returning a sentinel — `AgentManager.invoke()` treats
 * any thrown error as the run failing and records the message on the
 * `AgentRun`.
 */
export interface AgentExecutor {
  execute(agent: AgentDefinition, input: unknown): Promise<unknown>;
}

export interface AgentManagerLogger {
  debug(obj: Record<string, unknown>, msg?: string): void;
  info(obj: Record<string, unknown>, msg?: string): void;
  warn(obj: Record<string, unknown>, msg?: string): void;
  error(obj: Record<string, unknown>, msg?: string): void;
}
