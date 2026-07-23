import type { BusinessPolicy, PolicyContext, PolicyDecision } from "../types.js";

export class MinCommissionRatePolicy implements BusinessPolicy {
  readonly id = "MIN_COMMISSION_RATE";
  readonly name = "Minimum Commission Rate";
  readonly description = "Blocks joining any affiliate program below the minimum commission threshold";
  readonly category = "financial" as const;

  constructor(private readonly minRate: number = 25) {}

  evaluate(context: PolicyContext): PolicyDecision {
    if (context.action !== "join_network" && context.action !== "add_product") {
      return { kind: "allow", policyId: this.id, reason: "Not applicable to this action." };
    }
    const rate = context.commissionRate ?? 100;
    if (rate < this.minRate) {
      return {
        kind: "block",
        policyId: this.id,
        reason: `Commission rate ${rate}% is below the minimum threshold of ${this.minRate}%.`,
      };
    }
    return { kind: "allow", policyId: this.id, reason: `Commission rate ${rate}% meets the minimum threshold.` };
  }
}
