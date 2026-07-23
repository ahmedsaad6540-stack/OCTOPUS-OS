import { eq, and } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "@workspace/db";
import type { ExperimentStore, Experiment, ExperimentVariant } from "./types.js";

export class DrizzleExperimentStore implements ExperimentStore {
  constructor(private readonly db: NodePgDatabase<typeof schema>) {}

  async createExperiment(experiment: Omit<Experiment, 'id' | 'startedAt'>): Promise<Experiment> {
    const [inserted] = await this.db.insert(schema.experimentsTable).values({
      name: experiment.name,
      target: experiment.target,
      campaignId: experiment.campaignId,
      variants: experiment.variants,
      status: experiment.status,
      confidenceLevel: experiment.confidenceLevel,
      userId: experiment.userId,
    }).returning();

    return {
      id: inserted.id,
      name: inserted.name,
      target: inserted.target as Experiment['target'],
      campaignId: inserted.campaignId ?? undefined,
      variants: inserted.variants as ExperimentVariant[],
      status: inserted.status as Experiment['status'],
      winnerId: inserted.winnerId ?? undefined,
      confidenceLevel: inserted.confidenceLevel ?? 0,
      startedAt: inserted.startedAt,
      endedAt: inserted.endedAt ?? undefined,
      userId: inserted.userId ?? undefined,
    };
  }

  async getExperiment(id: string): Promise<Experiment | null> {
    const [exp] = await this.db.select().from(schema.experimentsTable).where(eq(schema.experimentsTable.id, id));
    if (!exp) return null;
    return {
      id: exp.id,
      name: exp.name,
      target: exp.target as Experiment['target'],
      campaignId: exp.campaignId ?? undefined,
      variants: exp.variants as ExperimentVariant[],
      status: exp.status as Experiment['status'],
      winnerId: exp.winnerId ?? undefined,
      confidenceLevel: exp.confidenceLevel ?? 0,
      startedAt: exp.startedAt,
      endedAt: exp.endedAt ?? undefined,
      userId: exp.userId ?? undefined,
    };
  }

  async updateVariantStats(id: string, variantId: string, visits: number, conversions: number, revenue: number): Promise<Experiment | null> {
    const exp = await this.getExperiment(id);
    if (!exp) return null;

    const updatedVariants = exp.variants.map(v => {
      if (v.id === variantId) {
        return {
          ...v,
          visits: v.visits + visits,
          conversions: v.conversions + conversions,
          revenue: v.revenue + revenue,
        };
      }
      return v;
    });

    const [updated] = await this.db.update(schema.experimentsTable)
      .set({ variants: updatedVariants, updatedAt: new Date() })
      .where(eq(schema.experimentsTable.id, id))
      .returning();

    if (!updated) return null;
    return {
      id: updated.id,
      name: updated.name,
      target: updated.target as Experiment['target'],
      campaignId: updated.campaignId ?? undefined,
      variants: updated.variants as ExperimentVariant[],
      status: updated.status as Experiment['status'],
      winnerId: updated.winnerId ?? undefined,
      confidenceLevel: updated.confidenceLevel ?? 0,
      startedAt: updated.startedAt,
      endedAt: updated.endedAt ?? undefined,
      userId: updated.userId ?? undefined,
    };
  }

  async declareWinner(id: string, winnerId: string, confidenceLevel: number): Promise<Experiment | null> {
    const [updated] = await this.db.update(schema.experimentsTable)
      .set({
        status: 'winner_declared',
        winnerId,
        confidenceLevel,
        endedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schema.experimentsTable.id, id))
      .returning();

    if (!updated) return null;
    return {
      id: updated.id,
      name: updated.name,
      target: updated.target as Experiment['target'],
      campaignId: updated.campaignId ?? undefined,
      variants: updated.variants as ExperimentVariant[],
      status: updated.status as Experiment['status'],
      winnerId: updated.winnerId ?? undefined,
      confidenceLevel: updated.confidenceLevel ?? 0,
      startedAt: updated.startedAt,
      endedAt: updated.endedAt ?? undefined,
      userId: updated.userId ?? undefined,
    };
  }

  async listExperiments(status?: Experiment['status'], campaignId?: string): Promise<Experiment[]> {
    const conditions = [];
    if (status) {
      conditions.push(eq(schema.experimentsTable.status, status));
    }
    if (campaignId) {
      conditions.push(eq(schema.experimentsTable.campaignId, campaignId));
    }

    const records = conditions.length > 0
      ? await this.db.select().from(schema.experimentsTable).where(and(...conditions))
      : await this.db.select().from(schema.experimentsTable);

    return records.map(exp => ({
      id: exp.id,
      name: exp.name,
      target: exp.target as Experiment['target'],
      campaignId: exp.campaignId ?? undefined,
      variants: exp.variants as ExperimentVariant[],
      status: exp.status as Experiment['status'],
      winnerId: exp.winnerId ?? undefined,
      confidenceLevel: exp.confidenceLevel ?? 0,
      startedAt: exp.startedAt,
      endedAt: exp.endedAt ?? undefined,
      userId: exp.userId ?? undefined,
    }));
  }
}
