import type { GoalStore, Milestone, MilestoneProgress } from "./types.js";
import { MILESTONES } from "./types.js";

export class GoalEngine {
  constructor(private readonly store: GoalStore) {}

  getCurrentMilestone(currentRevenue: number): Milestone {
    return MILESTONES.find(m => m.targetRevenue > currentRevenue) ?? MILESTONES[MILESTONES.length - 1];
  }

  getProgressPercent(currentRevenue: number, targetRevenue: number): number {
    return Math.min(100, parseFloat(((currentRevenue / targetRevenue) * 100).toFixed(2)));
  }

  async initialize(userId?: string): Promise<MilestoneProgress> {
    const active = await this.store.getActiveProgress(userId);
    if (active) return active;
    const first = MILESTONES[0];
    return this.store.initProgress(first.id, first.targetRevenue, userId);
  }

  async recordRevenue(userId: string, totalRevenue: number): Promise<{ progress: MilestoneProgress; advanced: boolean; newMilestone?: Milestone }> {
    const active = await this.store.getActiveProgress(userId);
    if (!active) {
      const progress = await this.initialize(userId);
      return { progress, advanced: false };
    }

    const updated = await this.store.updateProgress(active.id, totalRevenue);
    if (!updated) return { progress: active, advanced: false };

    if (totalRevenue >= active.targetRevenue) {
      await this.store.completeAndAdvance(active.id);
      const nextMilestone = this.getCurrentMilestone(totalRevenue);
      const newProgress = await this.store.initProgress(nextMilestone.id, nextMilestone.targetRevenue, userId);
      return { progress: newProgress, advanced: true, newMilestone: nextMilestone };
    }

    return { progress: updated, advanced: false };
  }

  async getStatus(userId: string): Promise<{ active: MilestoneProgress | null; all: MilestoneProgress[] }> {
    const [active, all] = await Promise.all([
      this.store.getActiveProgress(userId),
      this.store.listProgress(userId),
    ]);
    return { active, all };
  }
}
