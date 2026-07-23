import { randomUUID } from "node:crypto";
import type { TrendSignal, OpportunityScore, Platform, ViralDetectorStore } from "./types.js";

const PLATFORM_CATEGORIES: Record<Platform, string[]> = {
  tiktok: ["entertainment", "lifestyle", "finance", "health", "beauty", "food"],
  youtube: ["software", "education", "investing", "tech", "productivity"],
  twitter: ["crypto", "ai", "saas", "startups", "marketing"],
  facebook: ["health", "fitness", "parenting", "travel", "ecommerce"],
  instagram: ["beauty", "fashion", "fitness", "food", "lifestyle"],
  google_trends: ["finance", "health", "software", "education", "ecommerce"],
};

export class ViralDetector {
  constructor(
    private readonly store: ViralDetectorStore,
  ) {}

  /** Simulates trend scanning. In production, replace with real API calls (TikTok Trends API, YouTube Data API, etc.) */
  async scanTrends(platforms?: Platform[]): Promise<TrendSignal[]> {
    const targetPlatforms = platforms ?? (Object.keys(PLATFORM_CATEGORIES) as Platform[]);
    const signals: TrendSignal[] = [];

    for (const platform of targetPlatforms) {
      const categories = PLATFORM_CATEGORIES[platform];
      for (const topic of categories.slice(0, 2)) {
        const score = Math.floor(Math.random() * 40) + 60; // 60-100
        const signal: TrendSignal = {
          id: randomUUID(),
          topic: `${topic} hacks 2025`,
          platform,
          score,
          isViral: score > 75,
          relatedKeywords: [`best ${topic}`, `${topic} tips`, `${topic} guide`],
          estimatedReach: Math.floor(Math.random() * 1_000_000) + 100_000,
          detectedAt: new Date(),
        };
        const saved = await this.store.insertSignal(signal);
        signals.push(saved);
      }
    }

    return signals.sort((a, b) => b.score - a.score);
  }

  async scoreOpportunity(
    productName: string,
    niche: string,
    signals: TrendSignal[]
  ): Promise<OpportunityScore> {
    const nicheSignals = signals.filter(s =>
      s.relatedKeywords.some(k => k.toLowerCase().includes(niche.toLowerCase()))
    );
    const avgScore = nicheSignals.length
      ? nicheSignals.reduce((sum, s) => sum + s.score, 0) / nicheSignals.length
      : 50;

    const platforms = [...new Set(nicheSignals.map(s => s.platform))];
    const competitionLevel: OpportunityScore['competitionLevel'] = avgScore > 80 ? 'high' : avgScore > 60 ? 'medium' : 'low';

    return {
      productId: randomUUID(),
      productName,
      niche,
      trendAlignment: Math.round(avgScore),
      competitionLevel,
      profitPotential: Math.round(avgScore * 150),
      recommendedPlatforms: platforms.length > 0 ? platforms : ['youtube', 'tiktok'],
      signals: nicheSignals,
    };
  }

  async getTopOpportunities(limit = 5): Promise<TrendSignal[]> {
    return this.store.getTopSignals(limit);
  }
}
