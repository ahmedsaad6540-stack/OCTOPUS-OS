import { and, desc, eq } from "drizzle-orm";
import { strategicGoalsTable } from "@workspace/db/schema";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { GoalStore, MilestoneLevel, MilestoneProgress } from "./types.js";
import { randomUUID } from "node:crypto";

type Db = NodePgDatabase<any>;

function toMilestoneProgress(row: typeof strategicGoalsTable.$inferSelect): MilestoneProgress {
  const config = (row.strategyConfig as { milestoneId?: string }) ?? {};
  return {
    id: row.id,
    milestoneId: config.milestoneId ?? 'm1k',
    currentRevenue: row.currentProgress ?? 0,
    targetRevenue: (row.targetRevenue as MilestoneLevel) ?? 1000,
    progressPercent: row.targetRevenue > 0 ? Math.min(100, parseFloat((((row.currentProgress ?? 0) / row.targetRevenue) * 100).toFixed(2))) : 0,
    active: row.active ?? false,
    userId: row.userId ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleGoalStore implements GoalStore {
  constructor(private readonly db: Db) {}

  async initProgress(milestoneId: string, targetRevenue: MilestoneLevel, userId?: string): Promise<MilestoneProgress> {
    if (userId) {
      await this.db
        .update(strategicGoalsTable)
        .set({ active: false, updatedAt: new Date() })
        .where(eq(strategicGoalsTable.userId, userId));
    } else {
      await this.db
        .update(strategicGoalsTable)
        .set({ active: false, updatedAt: new Date() });
    }

    const id = randomUUID();
    const now = new Date();
    await this.db.insert(strategicGoalsTable).values({
      id,
      targetRevenue: Number(targetRevenue),
      currentProgress: 0,
      active: true,
      strategyConfig: { milestoneId },
      userId: userId ?? null,
      createdAt: now,
      updatedAt: now,
    });

    return {
      id,
      milestoneId,
      currentRevenue: 0,
      targetRevenue,
      progressPercent: 0,
      active: true,
      userId,
      createdAt: now,
      updatedAt: now,
    };
  }

  async getActiveProgress(userId?: string): Promise<MilestoneProgress | null> {
    const conditions = [eq(strategicGoalsTable.active, true)];
    if (userId) conditions.push(eq(strategicGoalsTable.userId, userId));
    const rows = await this.db
      .select()
      .from(strategicGoalsTable)
      .where(and(...conditions))
      .limit(1);
    return rows[0] ? toMilestoneProgress(rows[0]) : null;
  }

  async updateProgress(id: string, currentRevenue: number): Promise<MilestoneProgress | null> {
    await this.db
      .update(strategicGoalsTable)
      .set({
        currentProgress: Number(currentRevenue),
        updatedAt: new Date(),
      })
      .where(eq(strategicGoalsTable.id, id));
    const rows = await this.db
      .select()
      .from(strategicGoalsTable)
      .where(eq(strategicGoalsTable.id, id))
      .limit(1);
    return rows[0] ? toMilestoneProgress(rows[0]) : null;
  }

  async completeAndAdvance(id: string): Promise<MilestoneProgress | null> {
    await this.db
      .update(strategicGoalsTable)
      .set({
        active: false,
        updatedAt: new Date(),
      })
      .where(eq(strategicGoalsTable.id, id));
    const rows = await this.db
      .select()
      .from(strategicGoalsTable)
      .where(eq(strategicGoalsTable.id, id))
      .limit(1);
    return rows[0] ? toMilestoneProgress(rows[0]) : null;
  }

  async listProgress(userId?: string): Promise<MilestoneProgress[]> {
    const rows = await this.db
      .select()
      .from(strategicGoalsTable)
      .where(userId ? eq(strategicGoalsTable.userId, userId) : undefined)
      .orderBy(desc(strategicGoalsTable.createdAt));
    return rows.map(toMilestoneProgress);
  }
}
