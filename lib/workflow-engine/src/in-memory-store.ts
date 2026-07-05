import type {
  WorkflowDefinition,
  WorkflowDefinitionStore,
  WorkflowListQuery,
  WorkflowRun,
  WorkflowRunListQuery,
  WorkflowRunStore,
} from "./types.js";

/** In-memory workflow definition store for unit tests and local scripts. The api-server always wires up `DrizzleWorkflowStore`. */
export class InMemoryWorkflowStore implements WorkflowDefinitionStore {
  private readonly workflows = new Map<string, WorkflowDefinition>();

  async insert(workflow: WorkflowDefinition): Promise<WorkflowDefinition> {
    this.workflows.set(workflow.id, { ...workflow });
    return { ...workflow };
  }

  async update(id: string, workflow: WorkflowDefinition): Promise<WorkflowDefinition | null> {
    if (!this.workflows.has(id)) return null;
    this.workflows.set(id, { ...workflow });
    return { ...workflow };
  }

  async delete(id: string): Promise<boolean> {
    return this.workflows.delete(id);
  }

  async getById(id: string): Promise<WorkflowDefinition | null> {
    const workflow = this.workflows.get(id);
    return workflow ? { ...workflow } : null;
  }

  async list(query: WorkflowListQuery): Promise<WorkflowDefinition[]> {
    let results = Array.from(this.workflows.values());
    if (query.status) results = results.filter((w) => w.status === query.status);
    if (query.userId) results = results.filter((w) => w.userId === query.userId);
    results.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    const safeLimit = typeof query.limit === "number" && Number.isFinite(query.limit) ? query.limit : 100;
    return results.slice(0, Math.min(Math.max(safeLimit, 1), 500)).map((w) => ({ ...w }));
  }
}

/** In-memory workflow run store for unit tests and local scripts. The api-server always wires up `DrizzleWorkflowRunStore`. */
export class InMemoryWorkflowRunStore implements WorkflowRunStore {
  private readonly runs = new Map<string, WorkflowRun>();

  async insert(run: WorkflowRun): Promise<WorkflowRun> {
    this.runs.set(run.id, { ...run });
    return { ...run };
  }

  async update(id: string, run: WorkflowRun): Promise<WorkflowRun | null> {
    if (!this.runs.has(id)) return null;
    this.runs.set(id, { ...run });
    return { ...run };
  }

  async getById(id: string): Promise<WorkflowRun | null> {
    const run = this.runs.get(id);
    return run ? { ...run } : null;
  }

  async list(query: WorkflowRunListQuery): Promise<WorkflowRun[]> {
    let results = Array.from(this.runs.values());
    if (query.workflowId) results = results.filter((r) => r.workflowId === query.workflowId);
    if (query.status) results = results.filter((r) => r.status === query.status);
    if (query.userId) results = results.filter((r) => r.userId === query.userId);
    results.sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1));
    const safeLimit = typeof query.limit === "number" && Number.isFinite(query.limit) ? query.limit : 100;
    return results.slice(0, Math.min(Math.max(safeLimit, 1), 500)).map((r) => ({ ...r }));
  }
}
