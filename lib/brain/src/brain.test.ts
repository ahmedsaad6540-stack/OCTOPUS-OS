import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { DecisionEngine, firstMatchStrategy, priorityStrategy } from "@workspace/decision-engine";
import { Brain } from "./brain.js";
import { InMemoryBrainStore } from "./in-memory-store.js";
import type { BrainEvent, DecisionRule, EventPublisher, EventSubscriber, TaskEnqueuer, Unsubscribe } from "./types.js";

/**
 * Minimal in-memory EventBus double: enough to drive `subscribe`/`publish`
 * deterministically. Deliberately does not depend on `@workspace/event-bus`
 * at all — see the `EventSubscriber`/`EventPublisher` doc comments in
 * `types.ts` for why `Brain` is decoupled from that package.
 */
function createTestBus() {
  const subscriptions: Array<{ pattern: string; handlerName: string; handler: (event: BrainEvent) => Promise<void> | void }> = [];
  const published: Array<{ type: string; source: string; payload: unknown }> = [];

  function matches(pattern: string, type: string): boolean {
    if (pattern === "*") return true;
    if (pattern.endsWith(".*")) return type.startsWith(pattern.slice(0, -1));
    return pattern === type;
  }

  const bus: EventSubscriber & EventPublisher = {
    subscribe(pattern, handlerName, handler): Unsubscribe {
      const entry = { pattern, handlerName, handler: handler as (event: BrainEvent) => Promise<void> | void };
      subscriptions.push(entry);
      return () => {
        const idx = subscriptions.indexOf(entry);
        if (idx >= 0) subscriptions.splice(idx, 1);
      };
    },
    async publish(type, source, payload, options = {}) {
      published.push({ type, source, payload });
      const event: BrainEvent = {
        id: `evt-${published.length}`,
        type,
        version: options.version ?? 1,
        source,
        payload,
        metadata: {
          correlationId: options.correlationId ?? `corr-${published.length}`,
          ...(options.causationId ? { causationId: options.causationId } : {}),
          ...(options.userId ? { userId: options.userId } : {}),
        },
        occurredAt: new Date().toISOString(),
      };
      for (const sub of [...subscriptions]) {
        if (matches(sub.pattern, type)) await sub.handler(event);
      }
      return event;
    },
  };

  return { bus, published };
}

function createTestTaskQueue() {
  const enqueued: Array<{ type: string; source: string; payload: unknown }> = [];
  let counter = 0;
  const taskQueue: TaskEnqueuer = {
    async enqueue(type, source, payload) {
      enqueued.push({ type, source, payload });
      return { id: `task-${++counter}` };
    },
  };
  return { taskQueue, enqueued };
}

describe("Brain — OS Core decision maker", () => {
  test("registerRule subscribes and evaluate() records an enqueue_task decision", async () => {
    const { bus, published } = createTestBus();
    const { taskQueue, enqueued } = createTestTaskQueue();
    const brain = new Brain(new InMemoryBrainStore(), bus, taskQueue);

    const rule: DecisionRule = {
      name: "escalate-task-failure",
      pattern: "task.failed",
      evaluate: (event) => ({
        action: "enqueue_task",
        reason: "task failed permanently, notify owner",
        task: { type: "notification.send", payload: { taskId: (event.payload as { taskId: string }).taskId } },
      }),
    };
    brain.registerRule(rule);

    await bus.publish("task.failed", "task-queue", { taskId: "t-1" }, { correlationId: "corr-1" });

    assert.equal(enqueued.length, 1);
    assert.equal(enqueued[0]?.type, "notification.send");

    const decisionMade = published.find((p) => p.type === "brain.decision.made");
    assert.ok(decisionMade, "expected brain.decision.made to be published");
    const decision = decisionMade!.payload as { action: string; outcome: string; ruleName: string };
    assert.equal(decision.action, "enqueue_task");
    assert.equal(decision.outcome, "actioned");
    assert.equal(decision.ruleName, "escalate-task-failure");
  });

  test("evaluate() records a noop decision when a rule declines to act", async () => {
    const { bus } = createTestBus();
    const { taskQueue, enqueued } = createTestTaskQueue();
    const store = new InMemoryBrainStore();
    const brain = new Brain(store, bus, taskQueue);

    brain.registerRule({
      name: "ignore-low-priority",
      pattern: "task.failed",
      evaluate: () => ({ action: "noop", reason: "not worth escalating" }),
    });

    await bus.publish("task.failed", "task-queue", { taskId: "t-2" });

    assert.equal(enqueued.length, 0);
    const decisions = await store.list({});
    assert.equal(decisions.length, 1);
    assert.equal(decisions[0]?.outcome, "noop");
    assert.equal(decisions[0]?.reason, "not worth escalating");
  });

  test("a rule returning null/undefined is treated as noop", async () => {
    const { bus } = createTestBus();
    const { taskQueue } = createTestTaskQueue();
    const store = new InMemoryBrainStore();
    const brain = new Brain(store, bus, taskQueue);

    brain.registerRule({
      name: "silent-rule",
      pattern: "task.failed",
      evaluate: () => undefined,
    });

    await bus.publish("task.failed", "task-queue", {});

    const decisions = await store.list({});
    assert.equal(decisions[0]?.outcome, "noop");
    assert.equal(decisions[0]?.action, "noop");
  });

  test("a rule that throws is recorded as action_failed, not propagated", async () => {
    const { bus } = createTestBus();
    const { taskQueue } = createTestTaskQueue();
    const store = new InMemoryBrainStore();
    const brain = new Brain(store, bus, taskQueue);

    brain.registerRule({
      name: "broken-rule",
      pattern: "task.failed",
      evaluate: () => {
        throw new Error("boom");
      },
    });

    // Should not throw despite the rule throwing internally.
    await bus.publish("task.failed", "task-queue", {});

    const decisions = await store.list({});
    assert.equal(decisions.length, 1);
    assert.equal(decisions[0]?.outcome, "action_failed");
    assert.deepEqual(decisions[0]?.outcomeDetail, { error: "boom" });
  });

  test("a failing task enqueue is recorded as action_failed", async () => {
    const { bus } = createTestBus();
    const store = new InMemoryBrainStore();
    const failingTaskQueue: TaskEnqueuer = {
      async enqueue() {
        throw new Error("queue unavailable");
      },
    };
    const brain = new Brain(store, bus, failingTaskQueue);

    brain.registerRule({
      name: "flaky-action",
      pattern: "task.failed",
      evaluate: () => ({
        action: "enqueue_task",
        reason: "retry",
        task: { type: "retry.task", payload: {} },
      }),
    });

    await bus.publish("task.failed", "task-queue", {});

    const decisions = await store.list({});
    assert.equal(decisions[0]?.outcome, "action_failed");
    assert.deepEqual(decisions[0]?.outcomeDetail, { error: "queue unavailable" });
  });

  test("publish_event action publishes a follow-up event and records outcome", async () => {
    const { bus, published } = createTestBus();
    const { taskQueue } = createTestTaskQueue();
    const store = new InMemoryBrainStore();
    const brain = new Brain(store, bus, taskQueue);

    brain.registerRule({
      name: "alert-on-failure",
      pattern: "task.failed",
      evaluate: () => ({
        action: "publish_event",
        reason: "surface a system-wide alert",
        event: { type: "brain.alert.task_failed", payload: { severity: "high" } },
      }),
    });

    await bus.publish("task.failed", "task-queue", {});

    const alert = published.find((p) => p.type === "brain.alert.task_failed");
    assert.ok(alert, "expected the follow-up event to be published");
    assert.equal(alert!.source, "brain:alert-on-failure");

    const decisions = await store.list({});
    assert.equal(decisions[0]?.action, "publish_event");
    assert.equal(decisions[0]?.outcome, "actioned");
  });

  test("the Brain never re-evaluates rules against its own published events", async () => {
    const { bus, published } = createTestBus();
    const { taskQueue, enqueued } = createTestTaskQueue();
    const brain = new Brain(new InMemoryBrainStore(), bus, taskQueue);

    let evaluations = 0;
    brain.registerRule({
      name: "catch-all",
      pattern: "*",
      evaluate: () => {
        evaluations += 1;
        return { action: "enqueue_task", reason: "react to everything", task: { type: "noop.task", payload: {} } };
      },
    });

    await bus.publish("task.failed", "task-queue", {});

    // One evaluation of the original event; the resulting side effects
    // (the enqueue and the brain.decision.made broadcast) are both
    // self-authored (source "brain:catch-all" / "os-core:brain") and must
    // not trigger further evaluations, or this would loop forever.
    assert.equal(evaluations, 1);
    assert.equal(enqueued.length, 1);
    assert.equal(published.filter((p) => p.type === "brain.decision.made").length, 1);
  });

  test("registerRule throws on duplicate rule names", () => {
    const { bus } = createTestBus();
    const { taskQueue } = createTestTaskQueue();
    const brain = new Brain(new InMemoryBrainStore(), bus, taskQueue);

    const rule: DecisionRule = {
      name: "dup",
      pattern: "task.failed",
      evaluate: () => null,
    };
    brain.registerRule(rule);
    assert.throws(() => brain.registerRule(rule), /already registered/);
  });

  test("unsubscribe stops a rule from being evaluated", async () => {
    const { bus } = createTestBus();
    const { taskQueue, enqueued } = createTestTaskQueue();
    const brain = new Brain(new InMemoryBrainStore(), bus, taskQueue);

    const unsubscribe = brain.registerRule({
      name: "one-shot",
      pattern: "task.failed",
      evaluate: () => ({ action: "enqueue_task", reason: "x", task: { type: "x", payload: {} } }),
    });
    unsubscribe();

    await bus.publish("task.failed", "task-queue", {});

    assert.equal(enqueued.length, 0);
  });

  test("getDecision and listDecisions read through to the store", async () => {
    const { bus } = createTestBus();
    const { taskQueue } = createTestTaskQueue();
    const store = new InMemoryBrainStore();
    const brain = new Brain(store, bus, taskQueue);

    brain.registerRule({
      name: "record-me",
      pattern: "task.failed",
      evaluate: () => ({ action: "noop", reason: "observed" }),
    });

    await bus.publish("task.failed", "task-queue", {}, { correlationId: "corr-xyz" });

    const all = await brain.listDecisions({ correlationId: "corr-xyz" });
    assert.equal(all.length, 1);

    const fetched = await brain.getDecision(all[0]!.id);
    assert.equal(fetched?.ruleName, "record-me");

    assert.equal(await brain.getDecision("does-not-exist"), null);
  });
});

describe("Brain — Decision Engine arbitration", () => {
  test("default allMatchStrategy: every matching rule acts independently", async () => {
    const { bus } = createTestBus();
    const { taskQueue, enqueued } = createTestTaskQueue();
    const store = new InMemoryBrainStore();
    const brain = new Brain(store, bus, taskQueue);

    brain.registerRule({
      name: "rule-a",
      pattern: "task.failed",
      evaluate: () => ({ action: "enqueue_task", reason: "a", task: { type: "a.task", payload: {} } }),
    });
    brain.registerRule({
      name: "rule-b",
      pattern: "task.failed",
      evaluate: () => ({ action: "enqueue_task", reason: "b", task: { type: "b.task", payload: {} } }),
    });

    await bus.publish("task.failed", "task-queue", {});

    assert.equal(enqueued.length, 2);
    const decisions = await store.list({});
    assert.equal(decisions.length, 2);
    assert.ok(decisions.every((d) => d.outcome === "actioned"));
  });

  test("firstMatchStrategy: only the first-registered rule acts, the rest are superseded", async () => {
    const { bus } = createTestBus();
    const { taskQueue, enqueued } = createTestTaskQueue();
    const store = new InMemoryBrainStore();
    const engine = new DecisionEngine(firstMatchStrategy);
    const brain = new Brain(store, bus, taskQueue, undefined, engine);

    brain.registerRule({
      name: "rule-a",
      pattern: "task.failed",
      evaluate: () => ({ action: "enqueue_task", reason: "a", task: { type: "a.task", payload: {} } }),
    });
    brain.registerRule({
      name: "rule-b",
      pattern: "task.failed",
      evaluate: () => ({ action: "enqueue_task", reason: "b", task: { type: "b.task", payload: {} } }),
    });

    await bus.publish("task.failed", "task-queue", {});

    assert.equal(enqueued.length, 1);
    assert.equal(enqueued[0]?.type, "a.task");

    const decisions = await store.list({});
    const byRule = Object.fromEntries(decisions.map((d) => [d.ruleName, d]));
    assert.equal(byRule["rule-a"]?.outcome, "actioned");
    assert.equal(byRule["rule-b"]?.outcome, "superseded");
  });

  test("priorityStrategy: the higher-priority rule wins regardless of registration order", async () => {
    const { bus } = createTestBus();
    const { taskQueue, enqueued } = createTestTaskQueue();
    const store = new InMemoryBrainStore();
    const engine = new DecisionEngine(priorityStrategy);
    const brain = new Brain(store, bus, taskQueue, undefined, engine);

    brain.registerRule({
      name: "low-priority",
      pattern: "task.failed",
      priority: 1,
      evaluate: () => ({ action: "enqueue_task", reason: "low", task: { type: "low.task", payload: {} } }),
    });
    brain.registerRule({
      name: "high-priority",
      pattern: "task.failed",
      priority: 10,
      evaluate: () => ({ action: "enqueue_task", reason: "high", task: { type: "high.task", payload: {} } }),
    });

    await bus.publish("task.failed", "task-queue", {});

    assert.equal(enqueued.length, 1);
    assert.equal(enqueued[0]?.type, "high.task");

    const decisions = await store.list({});
    const byRule = Object.fromEntries(decisions.map((d) => [d.ruleName, d]));
    assert.equal(byRule["high-priority"]?.outcome, "actioned");
    assert.equal(byRule["low-priority"]?.outcome, "superseded");
  });

  test("a noop rule is recorded as noop, not superseded, even when other rules act", async () => {
    const { bus } = createTestBus();
    const { taskQueue, enqueued } = createTestTaskQueue();
    const store = new InMemoryBrainStore();
    const engine = new DecisionEngine(firstMatchStrategy);
    const brain = new Brain(store, bus, taskQueue, undefined, engine);

    brain.registerRule({
      name: "actor",
      pattern: "task.failed",
      evaluate: () => ({ action: "enqueue_task", reason: "act", task: { type: "x", payload: {} } }),
    });
    brain.registerRule({
      name: "observer",
      pattern: "task.failed",
      evaluate: () => ({ action: "noop", reason: "just observing" }),
    });

    await bus.publish("task.failed", "task-queue", {});

    assert.equal(enqueued.length, 1);
    const decisions = await store.list({});
    const byRule = Object.fromEntries(decisions.map((d) => [d.ruleName, d]));
    assert.equal(byRule["actor"]?.outcome, "actioned");
    assert.equal(byRule["observer"]?.outcome, "noop");
  });

  test("rules with different patterns are evaluated independently, no cross-arbitration", async () => {
    const { bus } = createTestBus();
    const { taskQueue, enqueued } = createTestTaskQueue();
    const store = new InMemoryBrainStore();
    const engine = new DecisionEngine(firstMatchStrategy);
    const brain = new Brain(store, bus, taskQueue, undefined, engine);

    brain.registerRule({
      name: "task-failed-rule",
      pattern: "task.failed",
      evaluate: () => ({ action: "enqueue_task", reason: "x", task: { type: "x", payload: {} } }),
    });
    brain.registerRule({
      name: "task-completed-rule",
      pattern: "task.completed",
      evaluate: () => ({ action: "enqueue_task", reason: "y", task: { type: "y", payload: {} } }),
    });

    await bus.publish("task.failed", "task-queue", {});
    await bus.publish("task.completed", "task-queue", {});

    // Each event only had one matching rule, so firstMatchStrategy never had
    // to arbitrate between them — both act.
    assert.equal(enqueued.length, 2);
    const decisions = await store.list({});
    assert.ok(decisions.every((d) => d.outcome === "actioned"));
  });
});
