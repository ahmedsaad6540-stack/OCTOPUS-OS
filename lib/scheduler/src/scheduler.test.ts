import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { Scheduler } from "./scheduler.js";
import { InMemoryScheduledJobStore, InMemoryScheduledJobRunStore } from "./in-memory-store.js";
import type { TaskEnqueuer, WorkflowRunner, WorkflowRunResult } from "./types.js";

function createFakeDeps() {
  const taskCalls: { type: string; payload: unknown }[] = [];
  const workflowCalls: { workflowId: string; input: unknown }[] = [];
  const workflowResults = new Map<string, WorkflowRunResult>();

  const taskEnqueuer: TaskEnqueuer = {
    async enqueue(type, _source, payload) {
      taskCalls.push({ type, payload });
      return { id: `task-${taskCalls.length}` };
    },
  };
  const workflowRunner: WorkflowRunner = {
    async run(workflowId, input) {
      workflowCalls.push({ workflowId, input });
      return workflowResults.get(workflowId) ?? { status: "completed", error: null };
    },
  };

  return { taskEnqueuer, workflowRunner, workflowResults, taskCalls, workflowCalls };
}

describe("Scheduler — CRUD and lifecycle", () => {
  test("create() computes nextRunAt from an interval schedule", async () => {
    const clock = () => new Date("2026-01-01T00:00:00.000Z");
    const scheduler = new Scheduler(new InMemoryScheduledJobStore(), new InMemoryScheduledJobRunStore(), {}, undefined, clock);
    const job = await scheduler.create({
      name: "job",
      schedule: { type: "interval", intervalMs: 60_000 },
      target: { type: "task", taskType: "x", payload: {} },
    });
    assert.equal(job.nextRunAt, "2026-01-01T00:01:00.000Z");
    assert.equal(job.status, "active");
  });

  test("create() computes nextRunAt from a cron schedule", async () => {
    const clock = () => new Date("2026-01-01T08:00:00.000Z");
    const scheduler = new Scheduler(new InMemoryScheduledJobStore(), new InMemoryScheduledJobRunStore(), {}, undefined, clock);
    const job = await scheduler.create({
      name: "job",
      schedule: { type: "cron", expression: "30 9 * * *" },
      target: { type: "task", taskType: "x", payload: {} },
    });
    assert.equal(job.nextRunAt, "2026-01-01T09:30:00.000Z");
  });

  test("update() recomputes nextRunAt only when the schedule changes", async () => {
    const clock = () => new Date("2026-01-01T00:00:00.000Z");
    const scheduler = new Scheduler(new InMemoryScheduledJobStore(), new InMemoryScheduledJobRunStore(), {}, undefined, clock);
    const job = await scheduler.create({
      name: "job",
      schedule: { type: "interval", intervalMs: 60_000 },
      target: { type: "task", taskType: "x", payload: {} },
    });

    const renamed = await scheduler.update(job.id, { name: "renamed" });
    assert.equal(renamed?.nextRunAt, job.nextRunAt);

    const rescheduled = await scheduler.update(job.id, { schedule: { type: "interval", intervalMs: 120_000 } });
    assert.equal(rescheduled?.nextRunAt, "2026-01-01T00:02:00.000Z");
  });

  test("enable()/disable() toggle status", async () => {
    const scheduler = new Scheduler(new InMemoryScheduledJobStore(), new InMemoryScheduledJobRunStore());
    const job = await scheduler.create({
      name: "job",
      schedule: { type: "interval", intervalMs: 1000 },
      target: { type: "task", taskType: "x", payload: {} },
    });
    await scheduler.disable(job.id);
    assert.equal((await scheduler.get(job.id))?.status, "disabled");
    await scheduler.enable(job.id);
    assert.equal((await scheduler.get(job.id))?.status, "active");
  });

  test("delete() removes the job", async () => {
    const scheduler = new Scheduler(new InMemoryScheduledJobStore(), new InMemoryScheduledJobRunStore());
    const job = await scheduler.create({
      name: "job",
      schedule: { type: "interval", intervalMs: 1000 },
      target: { type: "task", taskType: "x", payload: {} },
    });
    assert.equal(await scheduler.delete(job.id), true);
    assert.equal(await scheduler.get(job.id), null);
  });
});

describe("Scheduler — tick()", () => {
  test("runs a due task-targeted job and reschedules it", async () => {
    let currentTime = new Date("2026-01-01T00:00:00.000Z");
    const clock = () => currentTime;
    const deps = createFakeDeps();
    const runStore = new InMemoryScheduledJobRunStore();
    const scheduler = new Scheduler(new InMemoryScheduledJobStore(), runStore, deps, undefined, clock);

    const job = await scheduler.create({
      name: "recurring",
      schedule: { type: "interval", intervalMs: 60_000 },
      target: { type: "task", taskType: "heartbeat", payload: { ok: true } },
    });
    assert.equal(job.nextRunAt, "2026-01-01T00:01:00.000Z");

    // Not due yet.
    await scheduler.tick();
    assert.equal(deps.taskCalls.length, 0);

    currentTime = new Date("2026-01-01T00:01:00.000Z");
    await scheduler.tick();

    assert.equal(deps.taskCalls.length, 1);
    assert.deepEqual(deps.taskCalls[0], { type: "heartbeat", payload: { ok: true } });

    const updated = await scheduler.get(job.id);
    assert.equal(updated?.lastRunAt, "2026-01-01T00:01:00.000Z");
    assert.equal(updated?.nextRunAt, "2026-01-01T00:02:00.000Z");

    const runs = await runStore.list({ jobId: job.id });
    assert.equal(runs.length, 1);
    assert.equal(runs[0]?.status, "completed");
  });

  test("runs a due workflow-targeted job", async () => {
    let currentTime = new Date("2026-01-01T00:00:00.000Z");
    const clock = () => currentTime;
    const deps = createFakeDeps();
    const scheduler = new Scheduler(new InMemoryScheduledJobStore(), new InMemoryScheduledJobRunStore(), deps, undefined, clock);

    await scheduler.create({
      name: "wf-job",
      schedule: { type: "interval", intervalMs: 60_000 },
      target: { type: "workflow", workflowId: "wf-1", input: { x: 1 } },
    });

    currentTime = new Date("2026-01-01T00:01:00.000Z");
    await scheduler.tick();

    assert.equal(deps.workflowCalls.length, 1);
    assert.deepEqual(deps.workflowCalls[0], { workflowId: "wf-1", input: { x: 1 } });
  });

  test("records a failed run when the target's dependency isn't configured, without throwing", async () => {
    let currentTime = new Date("2026-01-01T00:00:00.000Z");
    const clock = () => currentTime;
    const scheduler = new Scheduler(new InMemoryScheduledJobStore(), new InMemoryScheduledJobRunStore(), {}, undefined, clock);
    await scheduler.create({
      name: "no-dep",
      schedule: { type: "interval", intervalMs: 1000 },
      target: { type: "task", taskType: "x", payload: {} },
    });

    currentTime = new Date("2026-01-01T00:00:01.000Z");
    await scheduler.tick();

    const runs = await scheduler.listRuns({});
    assert.equal(runs.length, 1);
    assert.equal(runs[0]?.status, "failed");
    assert.match(runs[0]?.error ?? "", /No TaskEnqueuer configured/);
  });

  test("a workflow run reported as failed marks the job run failed too", async () => {
    let currentTime = new Date("2026-01-01T00:00:00.000Z");
    const clock = () => currentTime;
    const deps = createFakeDeps();
    deps.workflowResults.set("wf-1", { status: "failed", error: "agent step blew up" });
    const scheduler = new Scheduler(new InMemoryScheduledJobStore(), new InMemoryScheduledJobRunStore(), deps, undefined, clock);

    await scheduler.create({
      name: "wf-job",
      schedule: { type: "interval", intervalMs: 1000 },
      target: { type: "workflow", workflowId: "wf-1", input: {} },
    });

    currentTime = new Date("2026-01-01T00:00:01.000Z");
    await scheduler.tick();

    const runs = await scheduler.listRuns({});
    assert.equal(runs[0]?.status, "failed");
    assert.match(runs[0]?.error ?? "", /agent step blew up/);
  });

  test("a disabled job is never picked up by tick()", async () => {
    let currentTime = new Date("2026-01-01T00:00:00.000Z");
    const clock = () => currentTime;
    const deps = createFakeDeps();
    const scheduler = new Scheduler(new InMemoryScheduledJobStore(), new InMemoryScheduledJobRunStore(), deps, undefined, clock);
    await scheduler.create({
      name: "disabled-job",
      schedule: { type: "interval", intervalMs: 1000 },
      target: { type: "task", taskType: "x", payload: {} },
      status: "disabled",
    });
    currentTime = new Date("2026-01-01T00:00:01.000Z");
    await scheduler.tick();
    assert.equal(deps.taskCalls.length, 0);
  });
});

describe("Scheduler — start()/stop()", () => {
  test("start() is idempotent and stop() clears the timer", () => {
    const scheduler = new Scheduler(new InMemoryScheduledJobStore(), new InMemoryScheduledJobRunStore());
    scheduler.start(1000);
    scheduler.start(1000); // should not create a second timer
    scheduler.stop();
    scheduler.stop(); // should not throw when called twice
  });
});
