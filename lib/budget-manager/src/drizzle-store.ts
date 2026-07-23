import { and, desc, eq, gte } from "drizzle-orm";
import { budgetSplitsTable, spendRecordsTable } from "@workspace/db/schema";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { BudgetStore, BudgetSplit, SpendRecord, ChannelAllocation, TrafficChannel } from "./types.js";
import { randomUUID } from "node:crypto";

type Db = NodePgDatabase<any>;

function toBudgetSplit(row: typeof budgetSplitsTable.$inferSelect): BudgetSplit {
  return {
    id: row.id,
    totalDailyBudgetUsd: row.totalDailyBudgetUsd ?? 100,
    allocations: (row.allocations as ChannelAllocation[]) ?? [],
    userId: row.userId ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toSpendRecord(row: typeof spendRecordsTable.$inferSelect): SpendRecord {
  return {
    id: row.id,
    channel: row.channel as TrafficChannel,
    amountUsd: row.amountUsd,
    campaignId: row.campaignId ?? undefined,
    spentAt: row.spentAt,
    userId: row.userId ?? undefined,
  };
}

export class DrizzleBudgetStore implements BudgetStore {
  constructor(private readonly db: Db) {}

  async upsertSplit(split: Omit<BudgetSplit, 'id' | 'createdAt' | 'updatedAt'>): Promise<BudgetSplit> {
    const existing = await this.getSplit(split.userId);
    const now = new Date();
    if (existing) {
      await this.db
        .update(budgetSplitsTable)
        .set({
          totalDailyBudgetUsd: Number(split.totalDailyBudgetUsd),
          allocations: split.allocations,
          updatedAt: now,
        })
        .where(eq(budgetSplitsTable.id, existing.id));
      return {
        ...existing,
        totalDailyBudgetUsd: split.totalDailyBudgetUsd,
        allocations: split.allocations,
        updatedAt: now,
      };
    }

    const id = randomUUID();
    await this.db.insert(budgetSplitsTable).values({
      id,
      totalDailyBudgetUsd: Number(split.totalDailyBudgetUsd),
      allocations: split.allocations,
      userId: split.userId ?? null,
      createdAt: now,
      updatedAt: now,
    });

    return {
      id,
      totalDailyBudgetUsd: split.totalDailyBudgetUsd,
      allocations: split.allocations,
      userId: split.userId,
      createdAt: now,
      updatedAt: now,
    };
  }

  async getSplit(userId?: string): Promise<BudgetSplit | null> {
    const rows = await this.db
      .select()
      .from(budgetSplitsTable)
      .where(userId ? eq(budgetSplitsTable.userId, userId) : undefined)
      .limit(1);
    return rows[0] ? toBudgetSplit(rows[0]) : null;
  }

  async recordSpend(spend: Omit<SpendRecord, 'id'>): Promise<SpendRecord> {
    const id = randomUUID();
    await this.db.insert(spendRecordsTable).values({
      id,
      channel: spend.channel,
      amountUsd: Number(spend.amountUsd),
      campaignId: spend.campaignId ?? null,
      spentAt: spend.spentAt ?? new Date(),
      userId: spend.userId ?? null,
    });
    return { ...spend, id, spentAt: spend.spentAt ?? new Date() };
  }

  async getDailySpend(userId?: string, date?: Date): Promise<SpendRecord[]> {
    const cutoff = date ?? new Date(new Date().setHours(0, 0, 0, 0));
    const conditions = [gte(spendRecordsTable.spentAt, cutoff)];
    if (userId) conditions.push(eq(spendRecordsTable.userId, userId));
    const rows = await this.db
      .select()
      .from(spendRecordsTable)
      .where(and(...conditions))
      .orderBy(desc(spendRecordsTable.spentAt));
    return rows.map(toSpendRecord);
  }
}
