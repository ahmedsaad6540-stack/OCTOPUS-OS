import { randomUUID } from "node:crypto";
import type { TrendSignal, Platform, ViralDetectorStore } from "./types.js";

export class InMemoryViralDetectorStore implements ViralDetectorStore {
  private readonly signals: TrendSignal[] = [];

  async insertSignal(signal: Omit<TrendSignal, 'id'>): Promise<TrendSignal> {
    const record = { ...signal, id: randomUUID() };
    this.signals.push(record);
    return record;
  }

  async listSignals(platform?: Platform, minScore = 0): Promise<TrendSignal[]> {
    return this.signals.filter(s =>
      (!platform || s.platform === platform) && s.score >= minScore
    );
  }

  async getTopSignals(limit: number): Promise<TrendSignal[]> {
    return [...this.signals].sort((a, b) => b.score - a.score).slice(0, limit);
  }
}
