import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  WorkflowEngine,
  WorkflowNotFoundError,
  WorkflowDisabledError,
  WorkflowDependencyMissingError,
} from "./workflow-engine.js";
import { InMemoryWorkflowStore, InMemoryWorkflowRunStore } from "./in-memory-store.js";
import type {
  AgentInvocationResult,
  AgentInvoker,
  EventPublisher,
  TaskEnqueuer,
  ToolInvoker,
  WorkflowStep,
} from "./types.js";

function createFakeDeps() {
  const toolCalls: { name: string; input: unknown }[] = [];
  const agentCalls: { agentId: string; input: unknown }[] = [];
  const taskCalls: { type: string; payload: unknown }[] = [];
  const eventCalls: { type: string; payload: unknown }[] = [];

  const toolInvoker: ToolInvoker = {
    async invoke(name, input) {
      toolCalls.push({ name, input });
      return { toolOutput: `ran ${name}`, input };
    },
  };
  const agentResults = new Map<string, AgentInvocationResult>();
  const agentInvoker: AgentInvoker = {
    async invoke(agentId, input) {
      agentCalls.push({ agentId, input });
      return agentResults.get(agentId) ?? { status: "completed", output: { reply: "ok" }, error: null };
    },
  };
  const taskEnqueuer: TaskEnqueuer = {
    async enqueue(type, _source, payload) {
      taskCalls.push({ type, payload });
      return { id: `task-${taskCalls.length}` };
    },
  };
  const eventPublisher: EventPublisher = {
    async publish(type, _source, payload) {
      eventCalls.push({ type, payload });
      return { id: `evt-${eventCalls.length}` };
    },
  };

  return { toolInvoker, agentInvoker, agentResults, taskEnqueuer, eventPublisher, toolCalls, agentCalls, taskCalls, eventCalls };
}

describe("WorkflowEngine — CRUD and lifecycle", () => {
  test("create() defaults status to active", async () => {
    const engine = new WorkflowEngine(new InMemoryWorkflowStore(), new InMemoryWorkflowRunStore());
    const workflow = await engine.create({ name: "wf", steps: [] });
    assert.equal(workflow.status, "active");
  });

  test("enable()/disable() toggle status", async () => {
    const engine = new WorkflowEngine(new InMemoryWorkflowStore(), new InMemoryWorkflowRunStore());
    const workflow = await engine.create({ name: "wf", steps: [] });
    await engine.disable(workflow.id);
    assert.equal((await engine.get(workflow.id))?.status, "disabled");
    await engine.enable(workflow.id);
    assert.equal((await engine.get(workflow.id))?.status, "active");
  });

  test("delete() removes the workflow", async () => {
    const engine = new WorkflowEngine(new InMemoryWorkflowStore(), new InMemoryWorkflowRunStore());
    const workflow = await engine.create({ name: "wf", steps: [] });
    assert.equal(await engine.delete(workflow.id), true);
    assert.equal(await engine.get(workflow.id), null);
  });
});

describe("WorkflowEngine — run()", () => {
  test("throws WorkflowNotFoundError for a nonexistent workflow", async () => {
    const engine = new WorkflowEngine(new InMemoryWorkflowStore(), new InMemoryWorkflowRunStore());
    await assert.rejects(() => engine.run("does-not-exist", {}), WorkflowNotFoundError);
  });

  test("throws WorkflowDisabledError for a disabled workflow", async () => {
    const engine = new WorkflowEngine(new InMemoryWorkflowStore(), new InMemoryWorkflowRunStore());
    const workflow = await engine.create({ name: "wf", steps: [], status: "disabled" });
    await assert.rejects(() => engine.run(workflow.id, {}), WorkflowDisabledError);
  });

  test("runs tool, agent, task, and event steps in order, threading outputs through templating", async () => {
    const deps = createFakeDeps();
    const engine = new WorkflowEngine(new InMemoryWorkflowStore(), new InMemoryWorkflowRunStore(), deps);

    const steps: WorkflowStep[] = [
      { type: "tool", name: "search", toolName: "web_search", input: { q: "{{input.query}}" } },
      { type: "agent", name: "summarize", agentId: "agent-1", input: { text: "{{steps.search.output.toolOutput}}" } },
      { type: "task", name: "notify", taskType: "notify.user", payload: { summary: "{{steps.summarize.output.reply}}" } },
      { type: "event", name: "done", eventType: "workflow.step.done", payload: { ok: true } },
    ];
    const workflow = await engine.create({ name: "research", steps });

    const run = await engine.run(workflow.id, { query: "octopus" }, "user-1");

    assert.equal(run.status, "completed");
    assert.equal(run.stepResults.length, 4);
    assert.ok(run.stepResults.every((r) => r.status === "completed"));

    assert.deepEqual(deps.toolCalls[0], { name: "web_search", input: { q: "octopus" } });
    assert.deepEqual(deps.agentCalls[0], { agentId: "agent-1", input: { text: "ran web_search" } });
    assert.deepEqual(deps.taskCalls[0], { type: "notify.user", payload: { summary: "ok" } });
    assert.deepEqual(deps.eventCalls[0], { type: "workflow.step.done", payload: { ok: true } });
  });

  test("stops at the first failing step and records why, leaving prior steps' results intact", async () => {
    const deps = createFakeDeps();
    deps.agentResults.set("agent-1", { status: "failed", output: null, error: "model unavailable" });
    const engine = new WorkflowEngine(new InMemoryWorkflowStore(), new InMemoryWorkflowRunStore(), deps);

    const steps: WorkflowStep[] = [
      { type: "tool", name: "search", toolName: "web_search", input: {} },
      { type: "agent", name: "summarize", agentId: "agent-1", input: {} },
      { type: "event", name: "never-reached", eventType: "should.not.publish", payload: {} },
    ];
    const workflow = await engine.create({ name: "research", steps });

    const run = await engine.run(workflow.id, {});

    assert.equal(run.status, "failed");
    assert.match(run.error!, /Step "summarize" failed: model unavailable/);
    assert.equal(run.stepResults.length, 2);
    assert.equal(run.stepResults[0]?.status, "completed");
    assert.equal(run.stepResults[1]?.status, "failed");
    assert.equal(deps.eventCalls.length, 0);
  });

  test("throws WorkflowDependencyMissingError when a step type has no configured dependency", async () => {
    const engine = new WorkflowEngine(new InMemoryWorkflowStore(), new InMemoryWorkflowRunStore(), {});
    const workflow = await engine.create({
      name: "wf",
      steps: [{ type: "tool", name: "search", toolName: "web_search", input: {} }],
    });

    const run = await engine.run(workflow.id, {});
    assert.equal(run.status, "failed");
    assert.match(run.error!, /No dependency configured to run a "tool" step/);
  });

  test("WorkflowDependencyMissingError is exported and constructible with the right message", () => {
    const err = new WorkflowDependencyMissingError("agent");
    assert.match(err.message, /"agent" step/);
  });

  test("getRun/listRuns read through to the store", async () => {
    const deps = createFakeDeps();
    const engine = new WorkflowEngine(new InMemoryWorkflowStore(), new InMemoryWorkflowRunStore(), deps);
    const workflow = await engine.create({
      name: "wf",
      steps: [{ type: "event", name: "e", eventType: "x", payload: {} }],
    });

    const run = await engine.run(workflow.id, {});
    assert.equal((await engine.getRun(run.id))?.id, run.id);
    assert.equal((await engine.listRuns({ workflowId: workflow.id })).length, 1);
    assert.equal(await engine.getRun("does-not-exist"), null);
  });
});
