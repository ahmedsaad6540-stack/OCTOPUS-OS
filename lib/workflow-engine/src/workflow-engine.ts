import { randomUUID } from "node:crypto";
import { renderTemplate } from "./template.js";
import type {
  CreateWorkflowInput,
  StepResult,
  UpdateWorkflowInput,
  WorkflowDefinition,
  WorkflowDefinitionStore,
  WorkflowEngineDependencies,
  WorkflowEngineLogger,
  WorkflowListQuery,
  WorkflowRun,
  WorkflowRunListQuery,
  WorkflowRunStore,
  WorkflowStep,
} from "./types.js";

const noopLogger: WorkflowEngineLogger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};

/** Thrown by `run()` when no workflow with that id exists. */
export class WorkflowNotFoundError extends Error {
  constructor(id: string) {
    super(`Workflow "${id}" does not exist`);
    this.name = "WorkflowNotFoundError";
  }
}

/** Thrown by `run()` when the workflow exists but is disabled. */
export class WorkflowDisabledError extends Error {
  constructor(id: string) {
    super(`Workflow "${id}" is disabled`);
    this.name = "WorkflowDisabledError";
  }
}

/** Thrown mid-run when a step's type has no corresponding dependency configured (e.g. an `agent` step with no `agentInvoker` wired up). */
export class WorkflowDependencyMissingError extends Error {
  constructor(stepType: string) {
    super(`No dependency configured to run a "${stepType}" step`);
    this.name = "WorkflowDependencyMissingError";
  }
}

/**
 * Orchestrates a fixed sequence of steps, run to completion or first
 * failure — no branching, no loops, no parallel steps. Each step's output
 * is recorded in the run's context under its `name`, so later steps can
 * reference it via whole-token templating (`"{{steps.<name>.output...}}"`,
 * `"{{input...}}"`). A `WorkflowRun` is always durably recorded, whether it
 * completes, fails partway through, or never even starts a first step.
 */
export class WorkflowEngine {
  constructor(
    private readonly store: WorkflowDefinitionStore,
    private readonly runStore: WorkflowRunStore,
    private readonly deps: WorkflowEngineDependencies = {},
    private readonly logger: WorkflowEngineLogger = noopLogger,
  ) {}

  async create(input: CreateWorkflowInput): Promise<WorkflowDefinition> {
    const now = new Date().toISOString();
    const workflow: WorkflowDefinition = {
      id: randomUUID(),
      name: input.name,
      ...(input.description !== undefined ? { description: input.description } : {}),
      steps: input.steps,
      status: input.status ?? "active",
      ...(input.userId ? { userId: input.userId } : {}),
      createdAt: now,
      updatedAt: now,
    };
    return this.store.insert(workflow);
  }

  async update(id: string, input: UpdateWorkflowInput): Promise<WorkflowDefinition | null> {
    const existing = await this.store.getById(id);
    if (!existing) return null;

    const updated: WorkflowDefinition = {
      ...existing,
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.steps !== undefined ? { steps: input.steps } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      updatedAt: new Date().toISOString(),
    };
    return this.store.update(id, updated);
  }

  async delete(id: string): Promise<boolean> {
    return this.store.delete(id);
  }

  async enable(id: string): Promise<WorkflowDefinition | null> {
    return this.update(id, { status: "active" });
  }

  async disable(id: string): Promise<WorkflowDefinition | null> {
    return this.update(id, { status: "disabled" });
  }

  async get(id: string): Promise<WorkflowDefinition | null> {
    return this.store.getById(id);
  }

  async list(query: WorkflowListQuery = {}): Promise<WorkflowDefinition[]> {
    return this.store.list(query);
  }

  /**
   * Runs a workflow's steps in order against `input`, recording a durable
   * `WorkflowRun` throughout. Stops at the first step that throws — every
   * step before it keeps its recorded result, and the run is marked
   * `failed` with the offending step named in `error`. Throws
   * `WorkflowNotFoundError`/`WorkflowDisabledError` before creating any run
   * at all, since nothing was attempted in either case.
   */
  async run(workflowId: string, input: unknown, userId?: string): Promise<WorkflowRun> {
    const workflow = await this.store.getById(workflowId);
    if (!workflow) throw new WorkflowNotFoundError(workflowId);
    if (workflow.status !== "active") throw new WorkflowDisabledError(workflowId);

    const startedAt = new Date().toISOString();
    let run: WorkflowRun = {
      id: randomUUID(),
      workflowId,
      status: "running",
      input,
      stepResults: [],
      error: null,
      ...(userId ? { userId } : {}),
      startedAt,
      completedAt: null,
    };
    run = await this.runStore.insert(run);
    this.logger.info({ runId: run.id, workflowId }, "workflow_engine.run_started");

    const context: Record<string, unknown> = { input, steps: {} };
    const stepResults: StepResult[] = [];

    for (const step of workflow.steps) {
      try {
        const output = await this.executeStep(step, context, userId);
        stepResults.push({ stepName: step.name, status: "completed", output, error: null });
        (context["steps"] as Record<string, unknown>)[step.name] = { output };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        stepResults.push({ stepName: step.name, status: "failed", output: null, error: message });
        const failed: WorkflowRun = {
          ...run,
          status: "failed",
          stepResults,
          error: `Step "${step.name}" failed: ${message}`,
          completedAt: new Date().toISOString(),
        };
        run = (await this.runStore.update(run.id, failed)) ?? failed;
        this.logger.error({ runId: run.id, step: step.name, error: message }, "workflow_engine.run_failed");
        return run;
      }
    }

    const completed: WorkflowRun = { ...run, status: "completed", stepResults, completedAt: new Date().toISOString() };
    run = (await this.runStore.update(run.id, completed)) ?? completed;
    this.logger.info({ runId: run.id, workflowId }, "workflow_engine.run_completed");
    return run;
  }

  async getRun(id: string): Promise<WorkflowRun | null> {
    return this.runStore.getById(id);
  }

  async listRuns(query: WorkflowRunListQuery = {}): Promise<WorkflowRun[]> {
    return this.runStore.list(query);
  }

  private async executeStep(step: WorkflowStep, context: Record<string, unknown>, userId?: string): Promise<unknown> {
    switch (step.type) {
      case "tool": {
        if (!this.deps.toolInvoker) throw new WorkflowDependencyMissingError("tool");
        const renderedInput = renderTemplate(step.input, context);
        return this.deps.toolInvoker.invoke(step.toolName, renderedInput, userId);
      }
      case "agent": {
        if (!this.deps.agentInvoker) throw new WorkflowDependencyMissingError("agent");
        const renderedInput = renderTemplate(step.input, context);
        const result = await this.deps.agentInvoker.invoke(step.agentId, renderedInput, userId);
        if (result.status === "failed") throw new Error(result.error ?? `agent "${step.agentId}" invocation failed`);
        return result.output;
      }
      case "task": {
        if (!this.deps.taskEnqueuer) throw new WorkflowDependencyMissingError("task");
        const renderedPayload = renderTemplate(step.payload, context);
        const task = await this.deps.taskEnqueuer.enqueue(step.taskType, "workflow-engine", renderedPayload, {
          ...(step.queue !== undefined ? { queue: step.queue } : {}),
          ...(step.priority !== undefined ? { priority: step.priority } : {}),
          ...(step.maxAttempts !== undefined ? { maxAttempts: step.maxAttempts } : {}),
          ...(userId ? { userId } : {}),
        });
        // Fire-and-forget by design: the workflow records the enqueued
        // task's id and moves on immediately rather than waiting for
        // task.completed. Waiting would require subscribing to the Event
        // Bus mid-run — a real future enhancement, not this module's job
        // today.
        return { taskId: task.id };
      }
      case "event": {
        if (!this.deps.eventPublisher) throw new WorkflowDependencyMissingError("event");
        const renderedPayload = renderTemplate(step.payload, context);
        const published = await this.deps.eventPublisher.publish(
          step.eventType,
          "workflow-engine",
          renderedPayload,
          userId ? { userId } : {},
        );
        return { published };
      }
    }
  }
}
