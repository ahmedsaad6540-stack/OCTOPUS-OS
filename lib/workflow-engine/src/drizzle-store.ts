import { and, desc, eq } from "drizzle-orm";
import {
  workflowDefinitionsTable,
  workflowRunsTable,
  type WorkflowDefinitionRecord,
  type WorkflowRunRecord,
} from "@workspace/db/schema";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type {
  StepResult,
  WorkflowDefinition,
  WorkflowDefinitionStore,
  WorkflowListQuery,
  WorkflowRun,
  WorkflowRunListQuery,
  WorkflowRunStore,
  WorkflowStatus,
  WorkflowStep,
} from "./types.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = NodePgDatabase<any>;

function toWorkflow(record: WorkflowDefinitionRecord): WorkflowDefinition {
  return {
    id: record.id,
    name: record.name,
    ...(record.description ? { description: record.description } : {}),
    steps: record.steps as WorkflowStep[],
    status: record.status as WorkflowStatus,
    ...(record.userId ? { userId: record.userId } : {}),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export class DrizzleWorkflowStore implements WorkflowDefinitionStore {
  constructor(private readonly db: Db) {}

  async insert(workflow: WorkflowDefinition): Promise<WorkflowDefinition> {
    await this.db.insert(workflowDefinitionsTable).values({
      id: workflow.id,
      name: workflow.name,
      description: workflow.description ?? null,
      steps: workflow.steps,
      status: workflow.status,
      userId: workflow.userId ?? null,
      createdAt: new Date(workflow.createdAt),
      updatedAt: new Date(workflow.updatedAt),
    });
    return workflow;
  }

  async update(id: string, workflow: WorkflowDefinition): Promise<WorkflowDefinition | null> {
    const rows = await this.db
      .update(workflowDefinitionsTable)
      .set({
        name: workflow.name,
        description: workflow.description ?? null,
        steps: workflow.steps,
        status: workflow.status,
        updatedAt: new Date(workflow.updatedAt),
      })
      .where(eq(workflowDefinitionsTable.id, id))
      .returning();
    return rows[0] ? toWorkflow(rows[0]) : null;
  }

  async delete(id: string): Promise<boolean> {
    const rows = await this.db.delete(workflowDefinitionsTable).where(eq(workflowDefinitionsTable.id, id)).returning();
    return rows.length > 0;
  }

  async getById(id: string): Promise<WorkflowDefinition | null> {
    const rows = await this.db.select().from(workflowDefinitionsTable).where(eq(workflowDefinitionsTable.id, id)).limit(1);
    return rows[0] ? toWorkflow(rows[0]) : null;
  }

  async list(query: WorkflowListQuery): Promise<WorkflowDefinition[]> {
    const conditions = [];
    if (query.status) conditions.push(eq(workflowDefinitionsTable.status, query.status));
    if (query.userId) conditions.push(eq(workflowDefinitionsTable.userId, query.userId));

    const rawLimit = query.limit;
    const safeLimit = typeof rawLimit === "number" && Number.isFinite(rawLimit) ? rawLimit : 100;

    const rows = await this.db
      .select()
      .from(workflowDefinitionsTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(workflowDefinitionsTable.createdAt))
      .limit(Math.min(Math.max(safeLimit, 1), 500));

    return rows.map(toWorkflow);
  }
}

function toWorkflowRun(record: WorkflowRunRecord): WorkflowRun {
  return {
    id: record.id,
    workflowId: record.workflowId,
    status: record.status as WorkflowRun["status"],
    input: record.input,
    stepResults: (record.stepResults as StepResult[] | null) ?? [],
    error: record.error,
    ...(record.userId ? { userId: record.userId } : {}),
    startedAt: record.startedAt.toISOString(),
    completedAt: record.completedAt ? record.completedAt.toISOString() : null,
  };
}

export class DrizzleWorkflowRunStore implements WorkflowRunStore {
  constructor(private readonly db: Db) {}

  async insert(run: WorkflowRun): Promise<WorkflowRun> {
    await this.db.insert(workflowRunsTable).values({
      id: run.id,
      workflowId: run.workflowId,
      status: run.status,
      input: run.input ?? null,
      stepResults: run.stepResults,
      error: run.error,
      userId: run.userId ?? null,
      startedAt: new Date(run.startedAt),
      completedAt: run.completedAt ? new Date(run.completedAt) : null,
    });
    return run;
  }

  async update(id: string, run: WorkflowRun): Promise<WorkflowRun | null> {
    const rows = await this.db
      .update(workflowRunsTable)
      .set({
        status: run.status,
        stepResults: run.stepResults,
        error: run.error,
        completedAt: run.completedAt ? new Date(run.completedAt) : null,
      })
      .where(eq(workflowRunsTable.id, id))
      .returning();
    return rows[0] ? toWorkflowRun(rows[0]) : null;
  }

  async getById(id: string): Promise<WorkflowRun | null> {
    const rows = await this.db.select().from(workflowRunsTable).where(eq(workflowRunsTable.id, id)).limit(1);
    return rows[0] ? toWorkflowRun(rows[0]) : null;
  }

  async list(query: WorkflowRunListQuery): Promise<WorkflowRun[]> {
    const conditions = [];
    if (query.workflowId) conditions.push(eq(workflowRunsTable.workflowId, query.workflowId));
    if (query.status) conditions.push(eq(workflowRunsTable.status, query.status));
    if (query.userId) conditions.push(eq(workflowRunsTable.userId, query.userId));

    const rawLimit = query.limit;
    const safeLimit = typeof rawLimit === "number" && Number.isFinite(rawLimit) ? rawLimit : 100;

    const rows = await this.db
      .select()
      .from(workflowRunsTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(workflowRunsTable.startedAt))
      .limit(Math.min(Math.max(safeLimit, 1), 500));

    return rows.map(toWorkflowRun);
  }
}
