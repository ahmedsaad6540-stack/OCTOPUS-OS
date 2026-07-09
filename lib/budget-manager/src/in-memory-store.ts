import { randomUUID } from "node:crypto";
import type { BudgetStore, BudgetSplit, SpendRecord } from "./types.js";

export class InMemoryBudgetStore implements BudgetStore {
  private readonly splits: BudgetSplit[] = [];
  private readonly spends: SpendRecord[] = [];

  async upsertSplit(split: Omit<BudgetSplit, 'id' | 'createdAt' | 'updatedAt'>): Promise<BudgetSplit> {
    const existing = this.splits.find(s => s.userId === split.userId);
    if (existing) {
      existing.totalDailyBudgetUsd = split.totalDailyBudgetUsd;
      existing.allocations = split.allocations;
      existing.updatedAt = new Date();
      return existing;
    }
    const record: BudgetSplit = { ...split, id: randomUUID(), createdAt: new Date(), updatedAt: new Date() };
    this.splits.push(record);
    return record;
  }

  async getSplit(userId?: string): Promise<BudgetSplit | null> {
    return this.splits.find(s => s.userId === userId) ?? null;
  }

  async recordSpend(spend: Omit<SpendRecord, 'id'>): Promise<SpendRecord> {
    const record: SpendRecord = { ...spend, id: randomUUID() };
    this.spends.push(record);
    return record;
  }

  async getDailySpend(userId?: string, date?: Date): Promise<SpendRecord[]> {
    const cutoff = date ?? new Date(new Date().setHours(0, 0, 0, 0));
    return this.spends.filter(s =>
      (!userId || s.userId === userId) && s.spentAt >= cutoff
    );
  }
}
