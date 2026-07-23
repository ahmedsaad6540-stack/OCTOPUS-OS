/**
 * The Workflow Engine orchestrates a fixed sequence of steps — run a tool,
 * invoke an agent, enqueue a task, publish an event — where later steps
 * can reference earlier steps' outputs. It never reimplements what any of
 * those things do; every step type delegates to the real module that owns
 * it, through a decoupled interface that module already satisfies
 * structurally (`ToolInvoker` mirrors `ToolManager.invoke`, `AgentInvoker`
 * mirrors `AgentManager.invoke`, `TaskEnqueuer` mirrors `TaskQueue.enqueue`,
 * `EventPublisher` mirrors `EventBus.publish`) — the same decoupling
 * pattern every OS Core module before this one uses. A step type whose
 * dependency wasn't supplied fails loudly (`WorkflowDependencyMissingError`)
 * rather than silently skipping.
 */

// ---------------------------------------------------------------------------
// Steps
// ---------------------------------------------------------------------------

export interface ToolStep {
  type: "tool";
  /** Unique within the workflow — how later steps reference this one's output via `{{steps.<name>.output...}}`. */
  name: string;
  toolName: string;
  input: unknown;
}

export interface AgentStep {
  type: "agent";
  name: string;
  agentId: string;
  input: unknown;
}

export interface TaskStep {
  type: "task";
  name: string;
  taskType: string;
  payload: unknown;
  queue?: string;
  priority?: number;
  maxAttempts?: number;
}

export interface EventStep {
  type: "event";
  name: string;
  eventType: string;
  payload: unknown;
}

export type WorkflowStep = ToolStep | AgentStep | TaskStep | EventStep;

// ---------------------------------------------------------------------------
// Workflow definitions (durable)
// ---------------------------------------------------------------------------

export type WorkflowStatus = "active" | "disabled";

export interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  steps: WorkflowStep[];
  status: WorkflowStatus;
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkflowInput {
  name: string;
  description?: string;
  steps: WorkflowStep[];
  status?: WorkflowStatus;
  userId?: string;
}

export type UpdateWorkflowInput = Partial<Omit<CreateWorkflowInput, "userId">>;

export interface WorkflowListQuery {
  status?: WorkflowStatus;
  userId?: string;
  limit?: number;
}

export interface WorkflowDefinitionStore {
  insert(workflow: WorkflowDefinition): Promise<WorkflowDefinition>;
  update(id: string, workflow: WorkflowDefinition): Promise<WorkflowDefinition | null>;
  delete(id: string): Promise<boolean>;
  getById(id: string): Promise<WorkflowDefinition | null>;
  list(query: WorkflowListQuery): Promise<WorkflowDefinition[]>;
}

// ---------------------------------------------------------------------------
// Workflow runs (durable execution record)
// ---------------------------------------------------------------------------

export type StepRunStatus = "completed" | "failed";

export interface StepResult {
  stepName: string;
  status: StepRunStatus;
  output: unknown;
  error: string | null;
}

export type WorkflowRunStatus = "running" | "completed" | "failed";

export interface WorkflowRun {
  id: string;
  workflowId: string;
  status: WorkflowRunStatus;
  input: unknown;
  stepResults: StepResult[];
  error: string | null;
  userId?: string;
  startedAt: string;
  completedAt: string | null;
}

export interface WorkflowRunListQuery {
  workflowId?: string;
  status?: WorkflowRunStatus;
  userId?: string;
  limit?: number;
}

export interface WorkflowRunStore {
  insert(run: WorkflowRun): Promise<WorkflowRun>;
  update(id: string, run: WorkflowRun): Promise<WorkflowRun | null>;
  getById(id: string): Promise<WorkflowRun | null>;
  list(query: WorkflowRunListQuery): Promise<WorkflowRun[]>;
}

// ---------------------------------------------------------------------------
// Dependency interop (decoupled — see file doc comment)
// ---------------------------------------------------------------------------

export interface TaskEnqueuer {
  enqueue<TPayload = unknown>(
    type: string,
    source: string,
    payload: TPayload,
    options?: {
      queue?: string;
      priority?: number;
      maxAttempts?: number;
      correlationId?: string;
      causationId?: string;
      userId?: string;
    },
  ): Promise<{ id: string }>;
}

export interface EventPublisher {
  publish<TPayload = unknown>(
    type: string,
    source: string,
    payload: TPayload,
    options?: {
      correlationId?: string;
      causationId?: string;
      userId?: string;
      version?: number;
    },
  ): Promise<unknown>;
}

/** Mirrors the fields of `AgentRun` in `@workspace/agent-manager` that the Workflow Engine actually needs. */
export interface AgentInvocationResult {
  status: string;
  output: unknown;
  error: string | null;
}

export interface AgentInvoker {
  invoke(agentId: string, input: unknown, userId?: string): Promise<AgentInvocationResult>;
}

export interface ToolInvoker {
  invoke(name: string, input: unknown, userId?: string): Promise<unknown>;
}

export interface WorkflowEngineDependencies {
  taskEnqueuer?: TaskEnqueuer;
  eventPublisher?: EventPublisher;
  agentInvoker?: AgentInvoker;
  toolInvoker?: ToolInvoker;
}

export interface WorkflowEngineLogger {
  debug(obj: Record<string, unknown>, msg?: string): void;
  info(obj: Record<string, unknown>, msg?: string): void;
  warn(obj: Record<string, unknown>, msg?: string): void;
  error(obj: Record<string, unknown>, msg?: string): void;
}
