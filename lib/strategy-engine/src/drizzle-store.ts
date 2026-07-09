import { eq, and } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "@workspace/db";
import type { StrategyStore, CampaignStrategy, PivotDecision } from "./types.js";

export class DrizzleStrategyStore implements StrategyStore {
  constructor(private readonly db: NodePgDatabase<typeof schema>) {}

  async saveStrategy(strategy: CampaignStrategy): Promise<CampaignStrategy> {
    return strategy;
  }

  async getStrategy(campaignId: string): Promise<CampaignStrategy | null> {
    return null;
  }

  async recordDecision(decision: Omit<PivotDecision, 'id' | 'createdAt'>): Promise<PivotDecision> {
    const [inserted] = await this.db.insert(schema.proposalsTable).values({
      title: `Pivot Decision for Campaign ${decision.campaignId}`,
      description: decision.reason,
      type: "pivot_decision",
      status: decision.approved ? "approved" : "pending",
      proposalData: {
        campaignId: decision.campaignId,
        decisionType: decision.decisionType,
      },
    }).returning();

    return {
      id: inserted.id,
      campaignId: decision.campaignId,
      decisionType: decision.decisionType,
      reason: decision.reason,
      approved: inserted.status === "approved",
      createdAt: inserted.createdAt,
    };
  }

  async getPendingDecisions(): Promise<PivotDecision[]> {
    const records = await this.db.select().from(schema.proposalsTable).where(
      and(
        eq(schema.proposalsTable.type, "pivot_decision"),
        eq(schema.proposalsTable.status, "pending")
      )
    );

    return records.map(r => {
      const data = r.proposalData as { campaignId: string; decisionType: PivotDecision['decisionType'] };
      return {
        id: r.id,
        campaignId: data.campaignId,
        decisionType: data.decisionType,
        reason: r.description,
        approved: false,
        createdAt: r.createdAt,
      };
    });
  }

  async approveDecision(id: string): Promise<PivotDecision | null> {
    const [updated] = await this.db.update(schema.proposalsTable)
      .set({ status: "approved", updatedAt: new Date() })
      .where(eq(schema.proposalsTable.id, id))
      .returning();

    if (!updated) return null;
    const data = updated.proposalData as { campaignId: string; decisionType: PivotDecision['decisionType'] };
    return {
      id: updated.id,
      campaignId: data.campaignId,
      decisionType: data.decisionType,
      reason: updated.description,
      approved: true,
      executedAt: updated.updatedAt,
      createdAt: updated.createdAt,
    };
  }
}
