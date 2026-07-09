import { randomUUID } from "node:crypto";
import type { ExperimentStore, Experiment } from "./types.js";

export class InMemoryExperimentStore implements ExperimentStore {
  private readonly experiments: Experiment[] = [];

  async createExperiment(experiment: Omit<Experiment, 'id' | 'startedAt'>): Promise<Experiment> {
    const record: Experiment = {
      ...experiment,
      id: randomUUID(),
      startedAt: new Date(),
    };
    this.experiments.push(record);
    return record;
  }

  async getExperiment(id: string): Promise<Experiment | null> {
    return this.experiments.find(e => e.id === id) ?? null;
  }

  async updateVariantStats(id: string, variantId: string, visits: number, conversions: number, revenue: number): Promise<Experiment | null> {
    const exp = this.experiments.find(e => e.id === id);
    if (!exp) return null;
    const v = exp.variants.find(varItem => varItem.id === variantId);
    if (v) {
      v.visits += visits;
      v.conversions += conversions;
      v.revenue += revenue;
    }
    return exp;
  }

  async declareWinner(id: string, winnerId: string, confidenceLevel: number): Promise<Experiment | null> {
    const exp = this.experiments.find(e => e.id === id);
    if (!exp) return null;
    exp.status = 'winner_declared';
    exp.winnerId = winnerId;
    exp.confidenceLevel = confidenceLevel;
    exp.endedAt = new Date();
    return exp;
  }

  async listExperiments(status?: Experiment['status'], campaignId?: string): Promise<Experiment[]> {
    return this.experiments.filter(e =>
      (!status || e.status === status) &&
      (!campaignId || e.campaignId === campaignId)
    );
  }
}
