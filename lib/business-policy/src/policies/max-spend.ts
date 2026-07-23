import type { BusinessPolicy, PolicyContext, PolicyDecision } from "../types.js";

export class MaxSpendPerDayPolicy implements BusinessPolicy {
  readonly id = "MAX_SPEND_PER_DAY";
  readonly name = "Maximum Daily Spend";
  readonly description = "Prevents spending more than the configured daily cap in USD";
  readonly category = "financial" as const;

  constructor(private readonly limitUsd: number = 100) {}

  evaluate(context: PolicyContext): PolicyDecision {
    const soFar = context.dailySpendSoFar ?? 0;
    const adding = context.amount ?? 0;
    if (soFar + adding > this.limitUsd) {
      return {
        kind: "block",
        policyId: this.id,
        reason: `Daily spend limit of $${this.limitUsd} would be exceeded. Already spent: $${soFar.toFixed(2)}, attempting to add: $${adding.toFixed(2)}.`,
      };
    }
    return { kind: "allow", policyId: this.id, reason: "Within daily spend limit." };
  }
}
