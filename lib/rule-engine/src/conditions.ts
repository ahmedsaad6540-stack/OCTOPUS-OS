import type { Condition, RuleEvent } from "./types.js";

/**
 * Resolves a dot-path (e.g. `"payload.taskId"`, `"metadata.userId"`,
 * `"type"`) against an event. Array indices are supported via numeric path
 * segments (e.g. `"payload.items.0.id"`). Returns `undefined` if any
 * segment along the path is missing.
 */
export function resolveField(event: RuleEvent, path: string): unknown {
  const segments = path.split(".");
  let current: unknown = event;
  for (const segment of segments) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

function compare(op: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "contains", actual: unknown, expected: unknown): boolean {
  switch (op) {
    case "eq":
      return actual === expected;
    case "neq":
      return actual !== expected;
    case "gt":
      return typeof actual === "number" && typeof expected === "number" && actual > expected;
    case "gte":
      return typeof actual === "number" && typeof expected === "number" && actual >= expected;
    case "lt":
      return typeof actual === "number" && typeof expected === "number" && actual < expected;
    case "lte":
      return typeof actual === "number" && typeof expected === "number" && actual <= expected;
    case "contains":
      if (typeof actual === "string") return typeof expected === "string" && actual.includes(expected);
      if (Array.isArray(actual)) return actual.some((item) => item === expected);
      return false;
  }
}

/** Pure, side-effect-free evaluation of a `Condition` tree against one event. Never throws — an unresolvable field simply fails to match. */
export function evaluateCondition(condition: Condition, event: RuleEvent): boolean {
  switch (condition.op) {
    case "and":
      return condition.conditions.every((c) => evaluateCondition(c, event));
    case "or":
      return condition.conditions.some((c) => evaluateCondition(c, event));
    case "not":
      return !evaluateCondition(condition.condition, event);
    case "exists":
      return resolveField(event, condition.field) !== undefined;
    default:
      return compare(condition.op, resolveField(event, condition.field), condition.value);
  }
}
