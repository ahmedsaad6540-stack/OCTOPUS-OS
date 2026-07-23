import { randomUUID } from "node:crypto";
import type { ProfitMemoryStore, SaleEvent, InsertSaleEvent, AttributionRecord, ProfitMetrics } from "./types.js";

export class InMemoryProfitMemoryStore implements ProfitMemoryStore {
  private readonly sales: SaleEvent[] = [];

  async insertSale(sale: InsertSaleEvent): Promise<SaleEvent> {
    const record: SaleEvent = {
      ...sale,
      id: randomUUID(),
      occurredAt: sale.occurredAt ?? new Date(),
    };
    this.sales.push(record);
    return record;
  }

  async listSales(userId?: string, since?: Date): Promise<SaleEvent[]> {
    return this.sales.filter(s =>
      (!userId || s.userId === userId) &&
      (!since || s.occurredAt >= since)
    );
  }

  async getAttribution(userId: string): Promise<AttributionRecord[]> {
    const userSales = this.sales.filter(s => s.userId === userId);
    const map = new Map<string, AttributionRecord>();

    for (const sale of userSales) {
      const key = `${sale.productName}:${sale.trafficSource}:${sale.country}`;
      const existing = map.get(key) ?? {
        productName: sale.productName,
        trafficSource: sale.trafficSource,
        keyword: sale.keyword,
        country: sale.country,
        revenue: 0,
        conversions: 0,
        avgRoi: 0,
      };

      existing.revenue += sale.revenue;
      existing.conversions += 1;
      existing.avgRoi = ((existing.avgRoi * (existing.conversions - 1)) + sale.roi) / existing.conversions;
      map.set(key, existing);
    }

    return Array.from(map.values());
  }

  async getMetrics(userId: string): Promise<ProfitMetrics> {
    const userSales = this.sales.filter(s => s.userId === userId);
    let totalRevenue = 0;
    let totalCost = 0;
    let totalCommission = 0;

    const countryMap = new Map<string, number>();
    const sourceMap = new Map<string, number>();

    for (const sale of userSales) {
      totalRevenue += sale.revenue;
      totalCost += sale.cost;
      totalCommission += sale.commission;

      countryMap.set(sale.country, (countryMap.get(sale.country) ?? 0) + sale.revenue);
      sourceMap.set(sale.trafficSource, (sourceMap.get(sale.trafficSource) ?? 0) + sale.revenue);
    }

    const attribution = await this.getAttribution(userId);
    const topProducts = [...attribution].sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    const topCountries = Array.from(countryMap.entries())
      .map(([country, revenue]) => ({ country, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const topSources = Array.from(sourceMap.entries())
      .map(([source, revenue]) => ({ source, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const conversions = userSales.length;
    const visits = conversions * 10 || 100;
    const roi = totalCost > 0 ? ((totalRevenue - totalCost) / totalCost) * 100 : 0;
    const epc = visits > 0 ? totalRevenue / visits : 0;
    const conversionRate = visits > 0 ? (conversions / visits) * 100 : 0;

    return {
      totalRevenue,
      totalCost,
      totalCommission,
      roi,
      epc,
      conversionRate,
      topProducts,
      topCountries,
      topSources,
    };
  }
}
