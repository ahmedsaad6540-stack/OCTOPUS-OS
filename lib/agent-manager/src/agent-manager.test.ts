import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { AgentManager, AgentExecutorNotConfiguredError, AgentNotInvocableError } from "./agent-manager.js";
import { InMemoryAgentStore, InMemoryAgentRunStore } from "./in-memory-store.js";
import type { AgentExecutor } from "./types.js";

function createEchoExecutor(): AgentExecutor {
  return {
    async execute(agent, input) {
      return { agentName: agent.name, echoed: input };
    },
  };
}

describe("AgentManager — CRUD and lifecycle", () => {
  test("create() defaults status to active and capabilities to []", async () => {
    const manager = new AgentManager(new InMemoryAgentStore(), new InMemoryAgentRunStore());
    const agent = await manager.create({ name: "researcher", instructions: "Research things." });
    assert.equal(agent.status, "active");
    assert.deepEqual(agent.capabilities, []);
  });

  test("update() merges partial fields and bumps updatedAt", async () => {
    const manager = new AgentManager(new InMemoryAgentStore(), new InMemoryAgentRunStore());
    const agent = await manager.create({ name: "researcher", instructions: "Research things." });
    await new Promise((r) => setTimeout(r, 2));
    const updated = await manager.update(agent.id, { capabilities: ["web_search"] });
    assert.deepEqual(updated?.capabilities, ["web_search"]);
    assert.equal(updated?.name, "researcher");
    assert.notEqual(updated?.updatedAt, agent.updatedAt);
  });

  test("update() on a nonexistent agent returns null", async () => {
    const manager = new AgentManager(new InMemoryAgentStore(), new InMemoryAgentRunStore());
    assert.equal(await manager.update("does-not-exist", { name: "x" }), null);
  });

  test("enable()/disable() toggle status", async () => {
    const manager = new AgentManager(new InMemoryAgentStore(), new InMemoryAgentRunStore());
    const agent = await manager.create({ name: "researcher", instructions: "x" });
    await manager.disable(agent.id);
    assert.equal((await manager.get(agent.id))?.status, "disabled");
    await manager.enable(agent.id);
    assert.equal((await manager.get(agent.id))?.status, "active");
  });

  test("delete() removes the agent", async () => {
    const manager = new AgentManager(new InMemoryAgentStore(), new InMemoryAgentRunStore());
    const agent = await manager.create({ name: "researcher", instructions: "x" });
    assert.equal(await manager.delete(agent.id), true);
    assert.equal(await manager.get(agent.id), null);
  });

  test("list() filters by status", async () => {
    const manager = new AgentManager(new InMemoryAgentStore(), new InMemoryAgentRunStore());
    await manager.create({ name: "a", instructions: "x" });
    await manager.create({ name: "b", instructions: "x", status: "disabled" });
    assert.equal((await manager.list({})).length, 2);
    assert.equal((await manager.list({ status: "active" })).length, 1);
    assert.equal((await manager.list({ status: "disabled" })).length, 1);
  });
});

describe("AgentManager — invoke()", () => {
  test("throws AgentNotInvocableError for a nonexistent agent", async () => {
    const manager = new AgentManager(new InMemoryAgentStore(), new InMemoryAgentRunStore(), undefined, createEchoExecutor());
    await assert.rejects(() => manager.invoke("does-not-exist", {}), AgentNotInvocableError);
  });

  test("throws AgentNotInvocableError for a disabled agent", async () => {
    const manager = new AgentManager(new InMemoryAgentStore(), new InMemoryAgentRunStore(), undefined, createEchoExecutor());
    const agent = await manager.create({ name: "x", instructions: "x", status: "disabled" });
    await assert.rejects(() => manager.invoke(agent.id, {}), AgentNotInvocableError);
  });

  test("throws AgentExecutorNotConfiguredError when no executor is wired, and records no run", async () => {
    const runStore = new InMemoryAgentRunStore();
    const manager = new AgentManager(new InMemoryAgentStore(), runStore);
    const agent = await manager.create({ name: "x", instructions: "x" });
    await assert.rejects(() => manager.invoke(agent.id, { q: "hi" }), AgentExecutorNotConfiguredError);
    assert.equal((await runStore.list({})).length, 0);
  });

  test("records a completed run on success", async () => {
    const runStore = new InMemoryAgentRunStore();
    const manager = new AgentManager(new InMemoryAgentStore(), runStore, undefined, createEchoExecutor());
    const agent = await manager.create({ name: "echo-agent", instructions: "x" });

    const run = await manager.invoke(agent.id, { q: "hello" }, "user-1");
    assert.equal(run.status, "completed");
    assert.deepEqual(run.output, { agentName: "echo-agent", echoed: { q: "hello" } });
    assert.equal(run.error, null);
    assert.equal(run.userId, "user-1");
    assert.ok(run.completedAt);
  });

  test("records a failed run when the executor throws", async () => {
    const runStore = new InMemoryAgentRunStore();
    const failingExecutor: AgentExecutor = {
      async execute() {
        throw new Error("model unavailable");
      },
    };
    const manager = new AgentManager(new InMemoryAgentStore(), runStore, undefined, failingExecutor);
    const agent = await manager.create({ name: "x", instructions: "x" });

    const run = await manager.invoke(agent.id, {});
    assert.equal(run.status, "failed");
    assert.equal(run.error, "model unavailable");
    assert.equal(run.output, null);
  });

  test("getRun/listRuns read through to the store", async () => {
    const runStore = new InMemoryAgentRunStore();
    const manager = new AgentManager(new InMemoryAgentStore(), runStore, undefined, createEchoExecutor());
    const agent = await manager.create({ name: "x", instructions: "x" });

    const run = await manager.invoke(agent.id, {});
    const fetched = await manager.getRun(run.id);
    assert.equal(fetched?.id, run.id);

    const runs = await manager.listRuns({ agentId: agent.id });
    assert.equal(runs.length, 1);

    assert.equal(await manager.getRun("does-not-exist"), null);
  });
});
