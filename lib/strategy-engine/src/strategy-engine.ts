import type { StrategyStore, PivotDecision } from "./types.js";

export class StrategyEngine {
  constructor(private readonly store: StrategyStore) {}

  async evaluateCampaignPerformance(campaignId: string, stats: {
    revenue: number;
    cost: number;
    conversions: number;
    roi: number;
  }): Promise<PivotDecision | null> {
    if (stats.roi < 20 && stats.cost > 50) {
      return this.store.recordDecision({
        campaignId,
        decisionType: stats.cost > 200 ? 'kill' : 'scale_down',
        reason: `Low ROI (${stats.roi.toFixed(1)}%) with cost of $${stats.cost.toFixed(2)}`,
        approved: false,
      });
    }

    if (stats.roi > 150 && stats.conversions >= 5) {
      return this.store.recordDecision({
        campaignId,
        decisionType: 'scale_up',
        reason: `Excellent ROI (${stats.roi.toFixed(1)}%) with ${stats.conversions} conversions`,
        approved: false,
      });
    }

    return null;
  }

  async getPendingPivots(): Promise<PivotDecision[]> {
    return this.store.getPendingDecisions();
  }

  async executePivot(id: string): Promise<PivotDecision | null> {
    return this.store.approveDecision(id);
  }
}
