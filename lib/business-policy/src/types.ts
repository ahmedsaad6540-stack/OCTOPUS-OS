export type PolicyCategory = 'financial' | 'ethical' | 'scaling' | 'niche';
export type PolicyDecisionKind = 'allow' | 'block' | 'warn';

export interface PolicyContext {
  action: string;           // e.g. "scale_campaign", "join_network", "spend_budget"
  userId?: string;
  amount?: number;          // spend amount in USD
  commissionRate?: number;  // percentage 0-100
  totalSales?: number;      // historical sales count
  niche?: string;           // niche name to check blocklist
  dailySpendSoFar?: number; // total spent today in USD
  meta?: Record<string, unknown>;
}

export interface PolicyDecision {
  kind: PolicyDecisionKind;
  policyId: string;
  reason: string;
}

export interface BusinessPolicy {
  id: string;
  name: string;
  description: string;
  category: PolicyCategory;
  evaluate(context: PolicyContext): PolicyDecision;
}

export interface PolicyEngineResult {
  allowed: boolean;
  decisions: PolicyDecision[];
  blockers: PolicyDecision[];
  warnings: PolicyDecision[];
}
