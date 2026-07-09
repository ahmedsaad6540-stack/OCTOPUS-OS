export type TrafficChannel = 'tiktok' | 'youtube' | 'facebook' | 'google' | 'twitter' | 'instagram' | 'testing';

export interface ChannelAllocation {
  channel: TrafficChannel;
  percentage: number;   // 0-100, must sum to 100 across all channels
  maxDailyUsd: number;
}

export interface BudgetSplit {
  id: string;
  totalDailyBudgetUsd: number;
  allocations: ChannelAllocation[];
  userId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SpendRecord {
  id: string;
  channel: TrafficChannel;
  amountUsd: number;
  campaignId?: string;
  spentAt: Date;
  userId?: string;
}

export interface BudgetStatus {
  channel: TrafficChannel;
  allocatedUsd: number;
  spentTodayUsd: number;
  remainingUsd: number;
  utilizationPercent: number;
}

export interface BudgetStore {
  upsertSplit(split: Omit<BudgetSplit, 'id' | 'createdAt' | 'updatedAt'>): Promise<BudgetSplit>;
  getSplit(userId?: string): Promise<BudgetSplit | null>;
  recordSpend(spend: Omit<SpendRecord, 'id'>): Promise<SpendRecord>;
  getDailySpend(userId?: string, date?: Date): Promise<SpendRecord[]>;
}
