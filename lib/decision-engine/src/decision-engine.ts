import { allMatchStrategy } from "./strategies.js";
import type { ArbitrationCandidate, ArbitrationStrategy } from "./types.js";

/**
 * Thin wrapper around a single `ArbitrationStrategy`. Exists as its own
 * class (rather than callers just holding a strategy directly) so the
 * strategy can be swapped at runtime — e.g. an ops endpoint that lets an
 * admin flip a Brain instance from `allMatchStrategy` to `priorityStrategy`
 * without restarting the process — and so every caller shares one place
 * that guards against a strategy mutating its input.
 */
export class DecisionEngine {
  constructor(private strategy: ArbitrationStrategy = allMatchStrategy) {}

  get strategyName(): string {
    return this.strategy.name;
  }

  setStrategy(strategy: ArbitrationStrategy): void {
    this.strategy = strategy;
  }

  arbitrate(candidates: ArbitrationCandidate[]): ArbitrationCandidate[] {
    const result = this.strategy.arbitrate([...candidates]);
    // Defensive: never trust a strategy to return only candidates it was given.
    const validNames = new Set(candidates.map((c) => c.ruleName));
    return result.filter((c) => validNames.has(c.ruleName));
  }
}
