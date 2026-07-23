import type { BudgetStore, BudgetSplit, BudgetStatus, ChannelAllocation, SpendRecord, TrafficChannel } from "./types.js";

const DEFAULT_ALLOCATIONS: ChannelAllocation[] = [
  { channel: 'tiktok',   percentage: 40, maxDailyUsd: 40 },
  { channel: 'youtube',  percentage: 30, maxDailyUsd: 30 },
  { channel: 'facebook', percentage: 20, maxDailyUsd: 20 },
  { channel: 'testing',  percentage: 10, maxDailyUsd: 10 },
];

export class BudgetManager {
  constructor(private readonly store: BudgetStore) {}

  async getOrCreateSplit(userId?: string, totalBudget = 100): Promise<BudgetSplit> {
    const existing = await this.store.getSplit(userId);
    if (existing) return existing;
    const allocations = DEFAULT_ALLOCATIONS.map(a => ({
      ...a,
      maxDailyUsd: (a.percentage / 100) * totalBudget,
    }));
    return this.store.upsertSplit({ totalDailyBudgetUsd: totalBudget, allocations, userId });
  }

  async getBudgetStatus(userId?: string): Promise<BudgetStatus[]> {
    const split = await this.getOrCreateSplit(userId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const spends = await this.store.getDailySpend(userId, today);

    const spendByChannel = new Map<TrafficChannel, number>();
    for (const spend of spends) {
      spendByChannel.set(spend.channel, (spendByChannel.get(spend.channel) ?? 0) + spend.amountUsd);
    }

    return split.allocations.map(alloc => {
      const spentToday = spendByChannel.get(alloc.channel) ?? 0;
      const remaining = Math.max(0, alloc.maxDailyUsd - spentToday);
      return {
        channel: alloc.channel,
        allocatedUsd: alloc.maxDailyUsd,
        spentTodayUsd: spentToday,
        remainingUsd: remaining,
        utilizationPercent: alloc.maxDailyUsd > 0 ? parseFloat(((spentToday / alloc.maxDailyUsd) * 100).toFixed(1)) : 0,
      };
    });
  }

  async canSpend(channel: TrafficChannel, amount: number, userId?: string): Promise<boolean> {
    const statuses = await this.getBudgetStatus(userId);
    const channelStatus = statuses.find(s => s.channel === channel);
    return channelStatus ? channelStatus.remainingUsd >= amount : false;
  }

  async recordSpend(channel: TrafficChannel, amountUsd: number, userId?: string, campaignId?: string): Promise<SpendRecord> {
    return this.store.recordSpend({ channel, amountUsd, campaignId, spentAt: new Date(), userId });
  }
}
