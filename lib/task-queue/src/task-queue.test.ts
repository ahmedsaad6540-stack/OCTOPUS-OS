import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { TaskQueue } from "./task-queue.js";
import { InMemoryTaskStore } from "./in-memory-store.js";
import type { EventPublisher } from "./types.js";

/**
 * Minimal in-memory EventPublisher double. Deliberately does not depend on
 * `@workspace/event-bus` at all — see the `EventPublisher` doc comment in
 * `types.ts` for why `TaskQueue` is decoupled from that package.
 */
function createRecordingPublisher() {
  const published: Array<{ type: string; source: string; payload: unknown }> = [];
  const publisher: EventPublisher = {
    async publish(type, source, payload) {
      published.push({ type, source, payload });
      return undefined;
    },
  };
  return { publisher, published };
}

describe("TaskQueue — Task Manager", () => {
  test("enqueue creates a queued task and publishes task.created", async () => {
    const { publisher, published } = createRecordingPublisher();
    const queue = new TaskQueue(new InMemoryTaskStore(), publisher);

    const task = await queue.enqueue("campaign.publish", "api-server", { campaignId: "abc" });

    assert.equal(task.status, "queued");
    assert.equal(task.type, "campaign.publish");
    assert.equal(task.queue, "default");
    assert.equal(task.attempts, 0);
    assert.equal(task.maxAttempts, 3);
    assert.deepEqual(task.payload, { campaignId: "abc" });

    assert.equal(published.length, 1);
    assert.equal(published[0]?.type, "task.created");
  });

  test("enqueue respects custom queue, priority and maxAttempts", async () => {
    const { publisher } = createRecordingPublisher();
    const queue = new TaskQueue(new InMemoryTaskStore(), publisher);

    const task = await queue.enqueue(
      "agent.prophet.predict",
      "os-core",
      { symbol: "BTC" },
      { queue: "agents", priority: 5, maxAttempts: 1 },
    );

    assert.equal(task.queue, "agents");
    assert.equal(task.priority, 5);
    assert.equal(task.maxAttempts, 1);
  });

  test("enqueue with delayMs is not immediately claimable", async () => {
    const { publisher } = createRecordingPublisher();
    const queue = new TaskQueue(new InMemoryTaskStore(), publisher);

    await queue.enqueue("delayed.task", "api-server", {}, { delayMs: 60_000 });
    const claimed = await queue.claim("worker-1");

    assert.equal(claimed, null);
  });

  test("get returns the task by id, list filters by status/type/queue", async () => {
    const { publisher } = createRecordingPublisher();
    const queue = new TaskQueue(new InMemoryTaskStore(), publisher);

    const t1 = await queue.enqueue("a.type", "api-server", {}, { queue: "q1" });
    await queue.enqueue("b.type", "api-server", {}, { queue: "q2" });

    const fetched = await queue.get(t1.id);
    assert.equal(fetched?.id, t1.id);

    const byQueue = await queue.list({ queue: "q1" });
    assert.equal(byQueue.length, 1);
    assert.equal(byQueue[0]?.id, t1.id);

    const byType = await queue.list({ type: "b.type" });
    assert.equal(byType.length, 1);
  });

  test("cancel moves a queued task to cancelled and publishes task.cancelled", async () => {
    const { publisher, published } = createRecordingPublisher();
    const queue = new TaskQueue(new InMemoryTaskStore(), publisher);

    const task = await queue.enqueue("a.type", "api-server", {});
    const cancelled = await queue.cancel(task.id, "api-server");

    assert.equal(cancelled?.status, "cancelled");
    assert.ok(published.some((e) => e.type === "task.cancelled"));
  });

  test("cancel is a no-op for an already-completed task", async () => {
    const { publisher } = createRecordingPublisher();
    const queue = new TaskQueue(new InMemoryTaskStore(), publisher);

    const task = await queue.enqueue("a.type", "api-server", {});
    await queue.claim("worker-1");
    await queue.complete(task.id, "worker-1", { ok: true });

    const result = await queue.cancel(task.id, "api-server");
    assert.equal(result, null);
  });

  test("cancel returns null for an unknown task id", async () => {
    const { publisher } = createRecordingPublisher();
    const queue = new TaskQueue(new InMemoryTaskStore(), publisher);
    const result = await queue.cancel("00000000-0000-0000-0000-000000000000", "api-server");
    assert.equal(result, null);
  });
});

describe("TaskQueue — Queue Manager", () => {
  test("claim returns queued tasks in priority order, then FIFO", async () => {
    const { publisher } = createRecordingPublisher();
    const queue = new TaskQueue(new InMemoryTaskStore(), publisher);

    const low = await queue.enqueue("t", "s", {}, { priority: 0 });
    const high = await queue.enqueue("t", "s", {}, { priority: 10 });
    await queue.enqueue("t", "s", {}, { priority: 0 });

    const first = await queue.claim("worker-1");
    assert.equal(first?.id, high.id, "highest priority task claimed first");

    const second = await queue.claim("worker-1");
    assert.equal(second?.id, low.id, "equal priority falls back to FIFO");
  });

  test("claim marks the task running, sets lock fields, and publishes task.started", async () => {
    const { publisher, published } = createRecordingPublisher();
    const queue = new TaskQueue(new InMemoryTaskStore(), publisher);

    await queue.enqueue("t", "s", {});
    const claimed = await queue.claim("worker-1");

    assert.equal(claimed?.status, "running");
    assert.equal(claimed?.lockedBy, "worker-1");
    assert.equal(claimed?.attempts, 1);
    assert.ok(claimed?.lockedAt);
    assert.ok(claimed?.startedAt);
    assert.ok(published.some((e) => e.type === "task.started"));
  });

  test("claim never returns the same task twice", async () => {
    const { publisher } = createRecordingPublisher();
    const queue = new TaskQueue(new InMemoryTaskStore(), publisher);

    await queue.enqueue("t", "s", {});
    const first = await queue.claim("worker-1");
    const second = await queue.claim("worker-2");

    assert.ok(first);
    assert.equal(second, null);
  });

  test("claim only pulls from the requested queue", async () => {
    const { publisher } = createRecordingPublisher();
    const queue = new TaskQueue(new InMemoryTaskStore(), publisher);

    await queue.enqueue("t", "s", {}, { queue: "reports" });
    const claimed = await queue.claim("worker-1", { queue: "agents" });

    assert.equal(claimed, null);
  });

  test("complete marks the task completed with its result and publishes task.completed", async () => {
    const { publisher, published } = createRecordingPublisher();
    const queue = new TaskQueue(new InMemoryTaskStore(), publisher);

    const task = await queue.enqueue("t", "s", {});
    await queue.claim("worker-1");
    const completed = await queue.complete(task.id, "worker-1", { total: 42 });

    assert.equal(completed?.status, "completed");
    assert.deepEqual(completed?.result, { total: 42 });
    assert.equal(completed?.lockedBy, null);
    assert.ok(published.some((e) => e.type === "task.completed"));
  });

  test("fail retries with backoff while attempts remain, then publishes task.retrying", async () => {
    const { publisher, published } = createRecordingPublisher();
    const queue = new TaskQueue(new InMemoryTaskStore(), publisher);

    const task = await queue.enqueue("t", "s", {}, { maxAttempts: 3 });
    await queue.claim("worker-1");
    const retried = await queue.fail(task.id, "worker-1", "boom");

    assert.equal(retried?.status, "queued");
    assert.equal(retried?.error, "boom");
    assert.equal(retried?.lockedBy, null);
    assert.ok(
      new Date(retried!.availableAt).getTime() > Date.now(),
      "retry is scheduled in the future",
    );
    assert.ok(published.some((e) => e.type === "task.retrying"));
  });

  test("fail marks permanently failed once attempts are exhausted", async () => {
    const { publisher, published } = createRecordingPublisher();
    const queue = new TaskQueue(new InMemoryTaskStore(), publisher);

    const task = await queue.enqueue("t", "s", {}, { maxAttempts: 1 });
    await queue.claim("worker-1");
    const failed = await queue.fail(task.id, "worker-1", "fatal");

    assert.equal(failed?.status, "failed");
    assert.equal(failed?.error, "fatal");
    assert.ok(published.some((e) => e.type === "task.failed"));
    assert.ok(!published.some((e) => e.type === "task.retrying"));
  });

  test("fail with retry:false fails permanently regardless of attempts remaining", async () => {
    const { publisher, published } = createRecordingPublisher();
    const queue = new TaskQueue(new InMemoryTaskStore(), publisher);

    const task = await queue.enqueue("t", "s", {}, { maxAttempts: 5 });
    await queue.claim("worker-1");
    const failed = await queue.fail(task.id, "worker-1", "non-retryable", { retry: false });

    assert.equal(failed?.status, "failed");
    assert.ok(published.some((e) => e.type === "task.failed"));
  });

  test("reclaimStale requeues tasks whose lock is older than the threshold", async () => {
    const { publisher, published } = createRecordingPublisher();
    const store = new InMemoryTaskStore();
    const queue = new TaskQueue(store, publisher);

    const task = await queue.enqueue("t", "s", {});
    await queue.claim("worker-1");

    // Negative threshold => "older than now + 1ms", so the lock just taken
    // above already counts as stale without needing to fake the clock.
    const reclaimed = await queue.reclaimStale(-1);

    assert.equal(reclaimed.length, 1);
    assert.equal(reclaimed[0]?.id, task.id);
    assert.equal(reclaimed[0]?.status, "queued");
    assert.equal(reclaimed[0]?.lockedBy, null);
    assert.ok(published.some((e) => e.type === "task.reclaimed"));

    // And it's claimable again.
    const reclaimedTask = await queue.claim("worker-2");
    assert.equal(reclaimedTask?.id, task.id);
  });

  test("complete/fail return null for a task id that doesn't exist", async () => {
    const { publisher } = createRecordingPublisher();
    const queue = new TaskQueue(new InMemoryTaskStore(), publisher);

    const missingId = "00000000-0000-0000-0000-000000000000";
    assert.equal(await queue.complete(missingId, "worker-1", {}), null);
    assert.equal(await queue.fail(missingId, "worker-1", "err"), null);
  });
});
