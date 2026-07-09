import type { BusinessPolicy, PolicyContext, PolicyDecision } from "../types.js";

export class ScaleAfterNSalesPolicy implements BusinessPolicy {
  readonly id = "SCALE_AFTER_N_SALES";
  readonly name = "Scale After N Sales";
  readonly description = "Prevents campaign scaling until a minimum number of proven sales is reached";
  readonly category = "scaling" as const;

  constructor(private readonly minSales: number = 20) {}

  evaluate(context: PolicyContext): PolicyDecision {
    if (context.action !== "scale_campaign") {
      return { kind: "allow", policyId: this.id, reason: "Not applicable to this action." };
    }
    const sales = context.totalSales ?? 0;
    if (sales < this.minSales) {
      return {
        kind: "block",
        policyId: this.id,
        reason: `Campaign has only ${sales} sales. Scaling requires at least ${this.minSales} proven sales.`,
      };
    }
    return { kind: "allow", policyId: this.id, reason: `Sufficient sales (${sales}) to allow scaling.` };
  }
}
