import { and, desc, eq, gte } from "drizzle-orm";
import { trendSignalsTable } from "@workspace/db/schema";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { TrendSignal, Platform, ViralDetectorStore } from "./types.js";
import { randomUUID } from "node:crypto";

type Db = NodePgDatabase<any>;

export class DrizzleViralDetectorStore implements ViralDetectorStore {
  constructor(private readonly db: Db) {}

  async insertSignal(signal: Omit<TrendSignal, 'id'>): Promise<TrendSignal> {
    const id = randomUUID();
    await this.db.insert(trendSignalsTable).values({
      id,
      topic: signal.topic,
      platform: signal.platform,
      score: signal.score,
      isViral: signal.isViral,
      relatedKeywords: signal.relatedKeywords,
      estimatedReach: signal.estimatedReach,
      detectedAt: signal.detectedAt ?? new Date(),
      userId: signal.userId ?? null,
    });
    return { ...signal, id };
  }

  async listSignals(platform?: Platform, minScore = 0): Promise<TrendSignal[]> {
    const conditions = [];
    if (platform) conditions.push(eq(trendSignalsTable.platform, platform));
    if (minScore > 0) conditions.push(gte(trendSignalsTable.score, minScore));
    const rows = await this.db
      .select()
      .from(trendSignalsTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(trendSignalsTable.score));
    return rows.map(r => ({
      id: r.id,
      topic: r.topic,
      platform: r.platform as Platform,
      score: r.score ?? 0,
      isViral: r.isViral ?? false,
      relatedKeywords: (r.relatedKeywords as string[]) ?? [],
      estimatedReach: r.estimatedReach ?? 0,
      detectedAt: r.detectedAt,
      userId: r.userId ?? undefined,
    }));
  }

  async getTopSignals(limit: number): Promise<TrendSignal[]> {
    const rows = await this.db
      .select()
      .from(trendSignalsTable)
      .orderBy(desc(trendSignalsTable.score))
      .limit(limit);
    return rows.map(r => ({
      id: r.id,
      topic: r.topic,
      platform: r.platform as Platform,
      score: r.score ?? 0,
      isViral: r.isViral ?? false,
      relatedKeywords: (r.relatedKeywords as string[]) ?? [],
      estimatedReach: r.estimatedReach ?? 0,
      detectedAt: r.detectedAt,
      userId: r.userId ?? undefined,
    }));
  }
}
