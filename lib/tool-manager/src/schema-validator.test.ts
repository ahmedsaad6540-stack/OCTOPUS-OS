import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { validateAgainstSchema } from "./schema-validator.js";
import type { JsonSchema } from "./types.js";

describe("validateAgainstSchema — primitives", () => {
  test("accepts a matching primitive type", () => {
    assert.equal(validateAgainstSchema({ type: "string" }, "hello").valid, true);
    assert.equal(validateAgainstSchema({ type: "number" }, 42).valid, true);
    assert.equal(validateAgainstSchema({ type: "boolean" }, true).valid, true);
  });

  test("rejects a mismatched primitive type with a clear message", () => {
    const result = validateAgainstSchema({ type: "string" }, 42);
    assert.equal(result.valid, false);
    assert.match(result.errors[0]!, /expected string, got number/);
  });

  test("distinguishes null and undefined from other types", () => {
    assert.equal(validateAgainstSchema({ type: "string" }, null).valid, false);
    assert.equal(validateAgainstSchema({ type: "string" }, undefined).valid, false);
  });

  test("enum restricts allowed values", () => {
    const schema: JsonSchema = { type: "string", enum: ["a", "b"] };
    assert.equal(validateAgainstSchema(schema, "a").valid, true);
    assert.equal(validateAgainstSchema(schema, "c").valid, false);
  });
});

describe("validateAgainstSchema — objects", () => {
  const schema: JsonSchema = {
    type: "object",
    required: ["name"],
    properties: {
      name: { type: "string" },
      age: { type: "number" },
    },
  };

  test("accepts an object with required properties present", () => {
    assert.equal(validateAgainstSchema(schema, { name: "Ada" }).valid, true);
  });

  test("rejects an object missing a required property", () => {
    const result = validateAgainstSchema(schema, { age: 30 });
    assert.equal(result.valid, false);
    assert.match(result.errors[0]!, /\$\.name: required property is missing/);
  });

  test("validates nested property types and reports the correct path", () => {
    const result = validateAgainstSchema(schema, { name: "Ada", age: "not a number" });
    assert.equal(result.valid, false);
    assert.match(result.errors[0]!, /\$\.age: expected number, got string/);
  });

  test("collects every violation, not just the first", () => {
    const result = validateAgainstSchema(schema, { age: "not a number" });
    assert.equal(result.errors.length, 2);
  });

  test("ignores properties not declared in the schema", () => {
    assert.equal(validateAgainstSchema(schema, { name: "Ada", extra: "field" }).valid, true);
  });
});

describe("validateAgainstSchema — arrays", () => {
  test("validates every item against `items`", () => {
    const schema: JsonSchema = { type: "array", items: { type: "string" } };
    assert.equal(validateAgainstSchema(schema, ["a", "b"]).valid, true);
    const result = validateAgainstSchema(schema, ["a", 2]);
    assert.equal(result.valid, false);
    assert.match(result.errors[0]!, /\$\[1\]: expected string, got number/);
  });

  test("an array schema without items accepts any array contents", () => {
    assert.equal(validateAgainstSchema({ type: "array" }, [1, "two", true]).valid, true);
  });
});

describe("validateAgainstSchema — nested structures", () => {
  test("validates a nested object inside an array inside an object", () => {
    const schema: JsonSchema = {
      type: "object",
      required: ["items"],
      properties: {
        items: {
          type: "array",
          items: {
            type: "object",
            required: ["id"],
            properties: { id: { type: "string" } },
          },
        },
      },
    };

    assert.equal(validateAgainstSchema(schema, { items: [{ id: "a" }, { id: "b" }] }).valid, true);
    const result = validateAgainstSchema(schema, { items: [{ id: "a" }, {}] });
    assert.equal(result.valid, false);
    assert.match(result.errors[0]!, /\$\.items\[1\]\.id: required property is missing/);
  });
});
