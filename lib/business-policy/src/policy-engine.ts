import type { BusinessPolicy, PolicyContext, PolicyEngineResult } from "./types.js";
import { MaxSpendPerDayPolicy } from "./policies/max-spend.js";
import { MinCommissionRatePolicy } from "./policies/min-commission.js";
import { ScaleAfterNSalesPolicy } from "./policies/scale-threshold.js";
import { BannedNichesPolicy } from "./policies/banned-niches.js";

export class PolicyEngine {
  private readonly policies: BusinessPolicy[];

  constructor(policies?: BusinessPolicy[]) {
    this.policies = policies ?? [
      new MaxSpendPerDayPolicy(),
      new MinCommissionRatePolicy(),
      new ScaleAfterNSalesPolicy(),
      new BannedNichesPolicy(),
    ];
  }

  addPolicy(policy: BusinessPolicy): this {
    this.policies.push(policy);
    return this;
  }

  evaluate(context: PolicyContext): PolicyEngineResult {
    const decisions = this.policies.map(p => p.evaluate(context));
    const blockers = decisions.filter(d => d.kind === "block");
    const warnings = decisions.filter(d => d.kind === "warn");
    return {
      allowed: blockers.length === 0,
      decisions,
      blockers,
      warnings,
    };
  }

  /** Throws if not allowed — use at hard gate points */
  enforce(context: PolicyContext): void {
    const result = this.evaluate(context);
    if (!result.allowed) {
      const reasons = result.blockers.map(b => `[${b.policyId}] ${b.reason}`).join("; ");
      throw new Error(`Action "${context.action}" blocked by Business Policy Engine: ${reasons}`);
    }
  }
}
