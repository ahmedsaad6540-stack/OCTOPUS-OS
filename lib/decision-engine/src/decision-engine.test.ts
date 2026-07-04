import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { DecisionEngine } from "./decision-engine.js";
import { allMatchStrategy, firstMatchStrategy, priorityStrategy } from "./strategies.js";
import type { ArbitrationCandidate } from "./types.js";

function candidate(overrides: Partial<ArbitrationCandidate> = {}): ArbitrationCandidate {
  return {
    ruleName: "rule",
    action: "enqueue_task",
    priority: 0,
    reason: "test",
    decision: null,
    ...overrides,
  };
}

describe("allMatchStrategy", () => {
  test("returns every candidate, unmodified order", () => {
    const candidates = [candidate({ ruleName: "a" }), candidate({ ruleName: "b" })];
    const result = allMatchStrategy.arbitrate(candidates);
    assert.deepEqual(
      result.map((c) => c.ruleName),
      ["a", "b"],
    );
  });

  test("returns [] for no candidates", () => {
    assert.deepEqual(allMatchStrategy.arbitrate([]), []);
  });
});

describe("firstMatchStrategy", () => {
  test("returns only the first candidate", () => {
    const candidates = [candidate({ ruleName: "a" }), candidate({ ruleName: "b" })];
    const result = firstMatchStrategy.arbitrate(candidates);
    assert.deepEqual(
      result.map((c) => c.ruleName),
      ["a"],
    );
  });

  test("returns [] for no candidates", () => {
    assert.deepEqual(firstMatchStrategy.arbitrate([]), []);
  });
});

describe("priorityStrategy", () => {
  test("returns the highest-priority candidate", () => {
    const candidates = [
      candidate({ ruleName: "low", priority: 1 }),
      candidate({ ruleName: "high", priority: 10 }),
      candidate({ ruleName: "mid", priority: 5 }),
    ];
    const result = priorityStrategy.arbitrate(candidates);
    assert.deepEqual(
      result.map((c) => c.ruleName),
      ["high"],
    );
  });

  test("ties go to the first-registered candidate", () => {
    const candidates = [
      candidate({ ruleName: "first", priority: 5 }),
      candidate({ ruleName: "second", priority: 5 }),
    ];
    const result = priorityStrategy.arbitrate(candidates);
    assert.deepEqual(
      result.map((c) => c.ruleName),
      ["first"],
    );
  });

  test("returns [] for no candidates", () => {
    assert.deepEqual(priorityStrategy.arbitrate([]), []);
  });
});

describe("DecisionEngine", () => {
  test("defaults to allMatchStrategy", () => {
    const engine = new DecisionEngine();
    assert.equal(engine.strategyName, "all-match");
    const candidates = [candidate({ ruleName: "a" }), candidate({ ruleName: "b" })];
    assert.equal(engine.arbitrate(candidates).length, 2);
  });

  test("setStrategy swaps behavior at runtime", () => {
    const engine = new DecisionEngine(allMatchStrategy);
    const candidates = [candidate({ ruleName: "a" }), candidate({ ruleName: "b" })];
    assert.equal(engine.arbitrate(candidates).length, 2);

    engine.setStrategy(firstMatchStrategy);
    assert.equal(engine.strategyName, "first-match");
    assert.equal(engine.arbitrate(candidates).length, 1);
  });

  test("ignores a misbehaving strategy that fabricates candidates", () => {
    const engine = new DecisionEngine({
      name: "rogue",
      arbitrate: () => [candidate({ ruleName: "not-in-input" })],
    });
    const result = engine.arbitrate([candidate({ ruleName: "a" })]);
    assert.deepEqual(result, []);
  });

  test("does not mutate the input array", () => {
    const engine = new DecisionEngine(firstMatchStrategy);
    const candidates = [candidate({ ruleName: "a" }), candidate({ ruleName: "b" })];
    const copy = [...candidates];
    engine.arbitrate(candidates);
    assert.deepEqual(candidates, copy);
  });
});
