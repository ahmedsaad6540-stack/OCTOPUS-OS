import type { ExperimentStore, Experiment } from "./types.js";

export class ExperimentEngine {
  constructor(private readonly store: ExperimentStore) {}

  async createAbTest(
    name: string,
    target: Experiment['target'],
    variants: { name: string; value: string }[],
    campaignId?: string,
    userId?: string
  ): Promise<Experiment> {
    const listVariants = variants.map((v, i) => ({
      id: `v_${i + 1}`,
      name: v.name,
      value: v.value,
      visits: 0,
      conversions: 0,
      revenue: 0,
    }));

    return this.store.createExperiment({
      name,
      target,
      campaignId,
      variants: listVariants,
      status: 'running',
      confidenceLevel: 0,
      userId,
    });
  }

  async recordInteraction(experimentId: string, variantId: string, isConversion: boolean, revenue = 0): Promise<Experiment | null> {
    return this.store.updateVariantStats(experimentId, variantId, 1, isConversion ? 1 : 0, revenue);
  }

  async evaluateExperiment(id: string): Promise<Experiment | null> {
    const exp = await this.store.getExperiment(id);
    if (!exp || exp.status !== 'running') return exp;

    let totalVisits = 0;
    let totalConversions = 0;
    for (const v of exp.variants) {
      totalVisits += v.visits;
      totalConversions += v.conversions;
    }

    if (totalVisits >= 100 && totalConversions >= 10) {
      let bestVariant = exp.variants[0];
      let bestRate = bestVariant.visits > 0 ? bestVariant.conversions / bestVariant.visits : 0;

      for (let i = 1; i < exp.variants.length; i++) {
        const v = exp.variants[i];
        const rate = v.visits > 0 ? v.conversions / v.visits : 0;
        if (rate > bestRate) {
          bestVariant = v;
          bestRate = rate;
        }
      }

      const confidenceLevel = 95;
      return this.store.declareWinner(id, bestVariant.id, confidenceLevel);
    }

    return exp;
  }
}
