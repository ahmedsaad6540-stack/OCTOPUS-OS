import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { renderTemplate } from "./template.js";
import type { RuleEvent } from "./types.js";

function makeEvent(overrides: Partial<RuleEvent> = {}): RuleEvent {
  return {
    id: "evt-1",
    type: "task.failed",
    version: 1,
    source: "task-queue",
    payload: { taskId: "t-1", nested: { count: 3 } },
    metadata: { correlationId: "corr-1" },
    occurredAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("renderTemplate", () => {
  test("replaces a whole-string token with the resolved value, preserving type", () => {
    const event = makeEvent();
    assert.equal(renderTemplate("{{payload.taskId}}", event), "t-1");
    assert.equal(renderTemplate("{{payload.nested.count}}", event), 3);
  });

  test("leaves non-token strings untouched, including ones containing braces", () => {
    const event = makeEvent();
    assert.equal(renderTemplate("plain text", event), "plain text");
    assert.equal(renderTemplate("prefix {{payload.taskId}} suffix", event), "prefix {{payload.taskId}} suffix");
  });

  test("leaves the literal token in place when the path does not resolve", () => {
    const event = makeEvent();
    assert.equal(renderTemplate("{{payload.missing}}", event), "{{payload.missing}}");
  });

  test("recurses through nested objects and arrays", () => {
    const event = makeEvent();
    const result = renderTemplate(
      { taskId: "{{payload.taskId}}", tags: ["static", "{{payload.nested.count}}"], nested: { x: "{{type}}" } },
      event,
    );
    assert.deepEqual(result, { taskId: "t-1", tags: ["static", 3], nested: { x: "task.failed" } });
  });

  test("passes through non-string primitives unchanged", () => {
    const event = makeEvent();
    assert.equal(renderTemplate(42, event), 42);
    assert.equal(renderTemplate(true, event), true);
    assert.equal(renderTemplate(null, event), null);
  });
});
