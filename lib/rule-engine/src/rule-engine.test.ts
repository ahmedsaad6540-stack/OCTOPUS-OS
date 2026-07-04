import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { RuleEngine, compileRule } from "./rule-engine.js";
import { InMemoryRuleDefinitionStore } from "./in-memory-store.js";
import type { CompiledRule, RuleEvent, RuleRegistrar, Unsubscribe } from "./types.js";

function createFakeRegistrar() {
  const registered = new Map<string, CompiledRule>();
  const registrar: RuleRegistrar = {
    registerRule(rule): Unsubscribe {
      registered.set(rule.name, rule);
      return () => registered.delete(rule.name);
    },
  };
  return { registrar, registered };
}

function makeEvent(overrides: Partial<RuleEvent> = {}): RuleEvent {
  return {
    id: "evt-1",
    type: "task.failed",
    version: 1,
    source: "task-queue",
    payload: { taskId: "t-1", attempts: 5 },
    metadata: { correlationId: "corr-1" },
    occurredAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("compileRule", () => {
  test("produces noop when the condition doesn't match", () => {
    const compiled = compileRule({
      id: "r1",
      name: "high attempts",
      eventPattern: "task.failed",
      condition: { op: "gt", field: "payload.attempts", value: 10 },
      action: { kind: "enqueue_task", taskType: "notify", payload: {} },
      priority: 0,
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const result = compiled.evaluate(makeEvent());
    assert.equal(result.action, "noop");
  });

  test("produces the templated action when the condition matches", () => {
    const compiled = compileRule({
      id: "r1",
      name: "high attempts",
      eventPattern: "task.failed",
      condition: { op: "gte", field: "payload.attempts", value: 5 },
      action: { kind: "enqueue_task", taskType: "notify", payload: { taskId: "{{payload.taskId}}" } },
      priority: 7,
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    assert.equal(compiled.pattern, "task.failed");
    assert.equal(compiled.priority, 7);
    assert.equal(compiled.name, "rule-engine:r1");

    const result = compiled.evaluate(makeEvent());
    assert.deepEqual(result, {
      action: "enqueue_task",
      reason: "rule condition matched",
      task: { type: "notify", payload: { taskId: "t-1" } },
    });
  });

  test("compiles a publish_event action", () => {
    const compiled = compileRule({
      id: "r2",
      name: "alert",
      eventPattern: "task.failed",
      condition: { op: "exists", field: "payload.taskId" },
      action: { kind: "publish_event", eventType: "alert.raised", payload: { severity: "high" } },
      priority: 0,
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const result = compiled.evaluate(makeEvent());
    assert.deepEqual(result, {
      action: "publish_event",
      reason: "rule condition matched",
      event: { type: "alert.raised", payload: { severity: "high" } },
    });
  });
});

describe("RuleEngine", () => {
  test("create() persists the rule and registers it immediately when enabled", async () => {
    const { registrar, registered } = createFakeRegistrar();
    const engine = new RuleEngine(new InMemoryRuleDefinitionStore(), registrar);

    const rule = await engine.create({
      name: "test rule",
      eventPattern: "task.failed",
      condition: { op: "exists", field: "payload.taskId" },
      action: { kind: "enqueue_task", taskType: "notify", payload: {} },
    });

    assert.equal(rule.enabled, true);
    assert.equal(rule.priority, 0);
    assert.ok(registered.has(`rule-engine:${rule.id}`));
  });

  test("create() with enabled: false does not register", async () => {
    const { registrar, registered } = createFakeRegistrar();
    const engine = new RuleEngine(new InMemoryRuleDefinitionStore(), registrar);

    const rule = await engine.create({
      name: "disabled rule",
      eventPattern: "task.failed",
      condition: { op: "exists", field: "payload.taskId" },
      action: { kind: "enqueue_task", taskType: "notify", payload: {} },
      enabled: false,
    });

    assert.equal(registered.size, 0);
    assert.equal(rule.enabled, false);
  });

  test("update() re-registers with the new definition", async () => {
    const { registrar, registered } = createFakeRegistrar();
    const engine = new RuleEngine(new InMemoryRuleDefinitionStore(), registrar);

    const rule = await engine.create({
      name: "test rule",
      eventPattern: "task.failed",
      condition: { op: "exists", field: "payload.taskId" },
      action: { kind: "enqueue_task", taskType: "notify", payload: {} },
    });

    const updated = await engine.update(rule.id, { eventPattern: "task.completed", priority: 5 });
    assert.equal(updated?.eventPattern, "task.completed");
    assert.equal(updated?.priority, 5);

    const compiled = registered.get(`rule-engine:${rule.id}`);
    assert.equal(compiled?.pattern, "task.completed");
    assert.equal(compiled?.priority, 5);
  });

  test("disable() unregisters without deleting; enable() re-registers", async () => {
    const { registrar, registered } = createFakeRegistrar();
    const engine = new RuleEngine(new InMemoryRuleDefinitionStore(), registrar);

    const rule = await engine.create({
      name: "toggle rule",
      eventPattern: "task.failed",
      condition: { op: "exists", field: "payload.taskId" },
      action: { kind: "enqueue_task", taskType: "notify", payload: {} },
    });
    assert.ok(registered.has(`rule-engine:${rule.id}`));

    await engine.disable(rule.id);
    assert.ok(!registered.has(`rule-engine:${rule.id}`));
    assert.equal((await engine.get(rule.id))?.enabled, false);

    await engine.enable(rule.id);
    assert.ok(registered.has(`rule-engine:${rule.id}`));
    assert.equal((await engine.get(rule.id))?.enabled, true);
  });

  test("delete() unregisters and removes the definition", async () => {
    const { registrar, registered } = createFakeRegistrar();
    const engine = new RuleEngine(new InMemoryRuleDefinitionStore(), registrar);

    const rule = await engine.create({
      name: "to delete",
      eventPattern: "task.failed",
      condition: { op: "exists", field: "payload.taskId" },
      action: { kind: "enqueue_task", taskType: "notify", payload: {} },
    });

    const deleted = await engine.delete(rule.id);
    assert.equal(deleted, true);
    assert.ok(!registered.has(`rule-engine:${rule.id}`));
    assert.equal(await engine.get(rule.id), null);
  });

  test("loadAndSync() registers every enabled rule from the store at startup", async () => {
    const store = new InMemoryRuleDefinitionStore();
    const { registrar: bootstrapRegistrar } = createFakeRegistrar();
    const bootstrapEngine = new RuleEngine(store, bootstrapRegistrar);
    await bootstrapEngine.create({
      name: "enabled-1",
      eventPattern: "task.failed",
      condition: { op: "exists", field: "payload.taskId" },
      action: { kind: "enqueue_task", taskType: "notify", payload: {} },
    });
    await bootstrapEngine.create({
      name: "disabled-1",
      eventPattern: "task.failed",
      condition: { op: "exists", field: "payload.taskId" },
      action: { kind: "enqueue_task", taskType: "notify", payload: {} },
      enabled: false,
    });

    // Simulate a fresh process: a new engine instance over the same store, with its own registrar.
    const { registrar, registered } = createFakeRegistrar();
    const freshEngine = new RuleEngine(store, registrar);
    await freshEngine.loadAndSync();

    assert.equal(registered.size, 1);
  });

  test("list() supports filtering by enabled and eventPattern", async () => {
    const { registrar } = createFakeRegistrar();
    const engine = new RuleEngine(new InMemoryRuleDefinitionStore(), registrar);

    await engine.create({
      name: "a",
      eventPattern: "task.failed",
      condition: { op: "exists", field: "payload.taskId" },
      action: { kind: "enqueue_task", taskType: "notify", payload: {} },
    });
    await engine.create({
      name: "b",
      eventPattern: "task.completed",
      condition: { op: "exists", field: "payload.taskId" },
      action: { kind: "enqueue_task", taskType: "notify", payload: {} },
      enabled: false,
    });

    assert.equal((await engine.list({})).length, 2);
    assert.equal((await engine.list({ enabled: true })).length, 1);
    assert.equal((await engine.list({ eventPattern: "task.completed" })).length, 1);
  });
});
