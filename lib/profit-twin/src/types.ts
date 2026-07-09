export interface TwinInsight {
  id: string;
  type: 'recommendation' | 'alert' | 'opportunity';
  metric: string;        // e.g. "ROI", "EPC", "cost"
  value: number;
  reason: string;
  confidence: number;    // 0-100
  suggestedAction: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}
