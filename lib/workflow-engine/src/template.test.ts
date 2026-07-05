import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { renderTemplate } from "./template.js";

describe("renderTemplate", () => {
  test("replaces a whole-string token with the resolved value, preserving type", () => {
    const context = { input: { taskId: "t-1" }, steps: { fetch: { output: { count: 3 } } } };
    assert.equal(renderTemplate("{{input.taskId}}", context), "t-1");
    assert.equal(renderTemplate("{{steps.fetch.output.count}}", context), 3);
  });

  test("leaves non-token strings untouched, including ones containing braces", () => {
    const context = { input: { taskId: "t-1" } };
    assert.equal(renderTemplate("plain text", context), "plain text");
    assert.equal(renderTemplate("prefix {{input.taskId}} suffix", context), "prefix {{input.taskId}} suffix");
  });

  test("leaves the literal token in place when the path does not resolve", () => {
    const context = { input: {} };
    assert.equal(renderTemplate("{{input.missing}}", context), "{{input.missing}}");
  });

  test("recurses through nested objects and arrays", () => {
    const context = { input: { id: "abc" }, steps: { step1: { output: "done" } } };
    const result = renderTemplate({ id: "{{input.id}}", tags: ["static", "{{steps.step1.output}}"] }, context);
    assert.deepEqual(result, { id: "abc", tags: ["static", "done"] });
  });

  test("passes through non-string primitives unchanged", () => {
    const context = {};
    assert.equal(renderTemplate(42, context), 42);
    assert.equal(renderTemplate(true, context), true);
    assert.equal(renderTemplate(null, context), null);
  });
});
