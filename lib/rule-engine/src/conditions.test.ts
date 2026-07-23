import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { evaluateCondition, resolveField } from "./conditions.js";
import type { RuleEvent } from "./types.js";

function makeEvent(overrides: Partial<RuleEvent> = {}): RuleEvent {
  return {
    id: "evt-1",
    type: "task.failed",
    version: 1,
    source: "task-queue",
    payload: { taskId: "t-1", attempts: 5, queue: "default" },
    metadata: { correlationId: "corr-1", userId: "user-1" },
    occurredAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("resolveField", () => {
  test("resolves nested dot paths", () => {
    const event = makeEvent();
    assert.equal(resolveField(event, "payload.taskId"), "t-1");
    assert.equal(resolveField(event, "metadata.userId"), "user-1");
    assert.equal(resolveField(event, "type"), "task.failed");
  });

  test("returns undefined for a missing path", () => {
    const event = makeEvent();
    assert.equal(resolveField(event, "payload.nonexistent"), undefined);
    assert.equal(resolveField(event, "payload.taskId.nested"), undefined);
  });
});

describe("evaluateCondition", () => {
  test("eq / neq", () => {
    const event = makeEvent();
    assert.equal(evaluateCondition({ op: "eq", field: "payload.taskId", value: "t-1" }, event), true);
    assert.equal(evaluateCondition({ op: "eq", field: "payload.taskId", value: "t-2" }, event), false);
    assert.equal(evaluateCondition({ op: "neq", field: "payload.taskId", value: "t-2" }, event), true);
  });

  test("numeric comparisons", () => {
    const event = makeEvent();
    assert.equal(evaluateCondition({ op: "gt", field: "payload.attempts", value: 3 }, event), true);
    assert.equal(evaluateCondition({ op: "gte", field: "payload.attempts", value: 5 }, event), true);
    assert.equal(evaluateCondition({ op: "lt", field: "payload.attempts", value: 3 }, event), false);
    assert.equal(evaluateCondition({ op: "lte", field: "payload.attempts", value: 5 }, event), true);
  });

  test("contains matches strings and arrays", () => {
    const event = makeEvent({ payload: { tags: ["urgent", "billing"] } });
    assert.equal(evaluateCondition({ op: "contains", field: "payload.tags", value: "urgent" }, event), true);
    assert.equal(evaluateCondition({ op: "contains", field: "payload.tags", value: "missing" }, event), false);
    assert.equal(evaluateCondition({ op: "contains", field: "type", value: "fail" }, event), true);
  });

  test("exists", () => {
    const event = makeEvent();
    assert.equal(evaluateCondition({ op: "exists", field: "payload.taskId" }, event), true);
    assert.equal(evaluateCondition({ op: "exists", field: "payload.nonexistent" }, event), false);
  });

  test("and / or / not compose", () => {
    const event = makeEvent();
    assert.equal(
      evaluateCondition(
        {
          op: "and",
          conditions: [
            { op: "eq", field: "type", value: "task.failed" },
            { op: "gt", field: "payload.attempts", value: 1 },
          ],
        },
        event,
      ),
      true,
    );
    assert.equal(
      evaluateCondition(
        { op: "or", conditions: [{ op: "eq", field: "type", value: "nope" }, { op: "exists", field: "payload.taskId" }] },
        event,
      ),
      true,
    );
    assert.equal(evaluateCondition({ op: "not", condition: { op: "eq", field: "type", value: "task.failed" } }, event), false);
  });

  test("numeric comparisons never throw on non-numeric operands, just fail to match", () => {
    const event = makeEvent();
    assert.equal(evaluateCondition({ op: "gt", field: "payload.taskId", value: 3 }, event), false);
  });
});
