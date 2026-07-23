import { randomUUID } from "node:crypto";
import type { StrategyStore, CampaignStrategy, PivotDecision } from "./types.js";

export class InMemoryStrategyStore implements StrategyStore {
  private readonly strategies = new Map<string, CampaignStrategy>();
  private readonly decisions: PivotDecision[] = [];

  async saveStrategy(strategy: CampaignStrategy): Promise<CampaignStrategy> {
    this.strategies.set(strategy.campaignId, { ...strategy, updatedAt: new Date() });
    return this.strategies.get(strategy.campaignId)!;
  }

  async getStrategy(campaignId: string): Promise<CampaignStrategy | null> {
    return this.strategies.get(campaignId) ?? null;
  }

  async recordDecision(decision: Omit<PivotDecision, 'id' | 'createdAt'>): Promise<PivotDecision> {
    const record: PivotDecision = {
      ...decision,
      id: randomUUID(),
      createdAt: new Date(),
    };
    this.decisions.push(record);
    return record;
  }

  async getPendingDecisions(): Promise<PivotDecision[]> {
    return this.decisions.filter(d => !d.approved);
  }

  async approveDecision(id: string): Promise<PivotDecision | null> {
    const record = this.decisions.find(d => d.id === id);
    if (!record) return null;
    record.approved = true;
    record.executedAt = new Date();
    return record;
  }
}
