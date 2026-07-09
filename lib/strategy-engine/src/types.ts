export interface CampaignStrategy {
  campaignId: string;
  niche: string;
  focus: 'lead_gen' | 'sales' | 'brand';
  targetCountries: string[];
  allocatedBudgetUsd: number;
  updatedAt: Date;
}

export interface PivotDecision {
  id: string;
  campaignId: string;
  decisionType: 'scale_up' | 'scale_down' | 'kill' | 'rotate_creative';
  reason: string;
  approved: boolean;
  executedAt?: Date;
  createdAt: Date;
}

export interface StrategyStore {
  saveStrategy(strategy: CampaignStrategy): Promise<CampaignStrategy>;
  getStrategy(campaignId: string): Promise<CampaignStrategy | null>;
  recordDecision(decision: Omit<PivotDecision, 'id' | 'createdAt'>): Promise<PivotDecision>;
  getPendingDecisions(): Promise<PivotDecision[]>;
  approveDecision(id: string): Promise<PivotDecision | null>;
}
