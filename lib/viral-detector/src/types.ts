export type Platform = 'tiktok' | 'youtube' | 'twitter' | 'facebook' | 'instagram' | 'google_trends';

export interface TrendSignal {
  id: string;
  topic: string;
  platform: Platform;
  score: number;       // 0-100
  isViral: boolean;    // score > 75
  relatedKeywords: string[];
  estimatedReach: number;
  detectedAt: Date;
  userId?: string;
}

export interface OpportunityScore {
  productId: string;
  productName: string;
  niche: string;
  trendAlignment: number;  // 0-100 how well product aligns with current trends
  competitionLevel: 'low' | 'medium' | 'high';
  profitPotential: number; // estimated monthly profit in USD
  recommendedPlatforms: Platform[];
  signals: TrendSignal[];
}

export interface ViralDetectorStore {
  insertSignal(signal: Omit<TrendSignal, 'id'>): Promise<TrendSignal>;
  listSignals(platform?: Platform, minScore?: number): Promise<TrendSignal[]>;
  getTopSignals(limit: number): Promise<TrendSignal[]>;
}
