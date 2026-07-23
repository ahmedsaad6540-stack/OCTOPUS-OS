import { randomUUID } from "node:crypto";
import type { TwinInsight } from "./types.js";

export class ProfitTwin {
  constructor() {}

  async analyzeMetrics(metrics: {
    totalRevenue: number;
    totalCost: number;
    roi: number;
    epc: number;
    topProducts: { productName: string; avgRoi: number }[];
  }): Promise<TwinInsight[]> {
    const insights: TwinInsight[] = [];

    // 1. High ROI Insight
    for (const product of metrics.topProducts) {
      if (product.avgRoi > 150) {
        insights.push({
          id: randomUUID(),
          type: 'opportunity',
          metric: 'ROI',
          value: product.avgRoi,
          reason: `Product "${product.productName}" has exceptional ROI of ${product.avgRoi.toFixed(1)}%.`,
          confidence: 90,
          suggestedAction: `scale_campaign:${product.productName}`,
          createdAt: new Date(),
        });
      }
    }

    // 2. High cost/low ROI Alert
    if (metrics.roi < 10 && metrics.totalCost > 100) {
      insights.push({
        id: randomUUID(),
        type: 'alert',
        metric: 'ROI',
        value: metrics.roi,
        reason: `Overall portfolio ROI (${metrics.roi.toFixed(1)}%) is dangerously low with $${metrics.totalCost.toFixed(2)} spent.`,
        confidence: 95,
        suggestedAction: 'reduce_budget_all',
        createdAt: new Date(),
      });
    }

    return insights;
  }
}
