import { randomUUID } from "node:crypto";
import type { GoalStore, MilestoneLevel, MilestoneProgress } from "./types.js";

export class InMemoryGoalStore implements GoalStore {
  private readonly progress: MilestoneProgress[] = [];

  async initProgress(milestoneId: string, targetRevenue: MilestoneLevel, userId?: string): Promise<MilestoneProgress> {
    for (const p of this.progress) p.active = false;
    const record: MilestoneProgress = {
      id: randomUUID(),
      milestoneId,
      currentRevenue: 0,
      targetRevenue,
      progressPercent: 0,
      active: true,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.progress.push(record);
    return record;
  }

  async getActiveProgress(userId?: string): Promise<MilestoneProgress | null> {
    return this.progress.find(p => p.active && (!userId || p.userId === userId)) ?? null;
  }

  async updateProgress(id: string, currentRevenue: number): Promise<MilestoneProgress | null> {
    const p = this.progress.find(p => p.id === id);
    if (!p) return null;
    p.currentRevenue = currentRevenue;
    p.progressPercent = Math.min(100, parseFloat(((currentRevenue / p.targetRevenue) * 100).toFixed(2)));
    p.updatedAt = new Date();
    return p;
  }

  async completeAndAdvance(id: string): Promise<MilestoneProgress | null> {
    const p = this.progress.find(p => p.id === id);
    if (!p) return null;
    p.active = false;
    p.completedAt = new Date();
    p.updatedAt = new Date();
    return p;
  }

  async listProgress(userId?: string): Promise<MilestoneProgress[]> {
    return this.progress.filter(p => !userId || p.userId === userId);
  }
}
