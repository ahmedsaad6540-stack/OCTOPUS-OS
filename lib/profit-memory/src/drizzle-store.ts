import { eq, and, gte } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "@workspace/db";
import type { ProfitMemoryStore, SaleEvent, InsertSaleEvent, AttributionRecord, ProfitMetrics } from "./types.js";

export class DrizzleProfitMemoryStore implements ProfitMemoryStore {
  constructor(private readonly db: NodePgDatabase<typeof schema>) {}

  async insertSale(sale: InsertSaleEvent): Promise<SaleEvent> {
    const [inserted] = await this.db.insert(schema.profitMemoryTable).values({
      campaignId: sale.campaignId,
      productName: sale.productName,
      affiliateNetwork: sale.affiliateNetwork,
      trafficSource: sale.trafficSource,
      keyword: sale.keyword,
      country: sale.country,
      revenue: sale.revenue,
      commission: sale.commission,
      cost: sale.cost,
      roi: sale.roi,
      userId: sale.userId,
    }).returning();

    return {
      id: inserted.id,
      campaignId: inserted.campaignId ?? undefined,
      productName: inserted.productName,
      affiliateNetwork: inserted.affiliateNetwork,
      trafficSource: inserted.trafficSource,
      keyword: inserted.keyword ?? undefined,
      country: inserted.country ?? "US",
      revenue: inserted.revenue ?? 0,
      commission: inserted.commission ?? 0,
      cost: inserted.cost ?? 0,
      roi: inserted.roi ?? 0,
      occurredAt: inserted.occurredAt,
      userId: inserted.userId ?? undefined,
    };
  }

  async listSales(userId?: string, since?: Date): Promise<SaleEvent[]> {
    const conditions = [];
    if (userId) {
      conditions.push(eq(schema.profitMemoryTable.userId, userId));
    }
    if (since) {
      conditions.push(gte(schema.profitMemoryTable.occurredAt, since));
    }

    const records = conditions.length > 0
      ? await this.db.select().from(schema.profitMemoryTable).where(and(...conditions))
      : await this.db.select().from(schema.profitMemoryTable);

    return records.map(r => ({
      id: r.id,
      campaignId: r.campaignId ?? undefined,
      productName: r.productName,
      affiliateNetwork: r.affiliateNetwork,
      trafficSource: r.trafficSource,
      keyword: r.keyword ?? undefined,
      country: r.country ?? "US",
      revenue: r.revenue ?? 0,
      commission: r.commission ?? 0,
      cost: r.cost ?? 0,
      roi: r.roi ?? 0,
      occurredAt: r.occurredAt,
      userId: r.userId ?? undefined,
    }));
  }

  async getAttribution(userId: string): Promise<AttributionRecord[]> {
    const sales = await this.listSales(userId);
    const map = new Map<string, AttributionRecord>();

    for (const sale of sales) {
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
    const sales = await this.listSales(userId);
    let totalRevenue = 0;
    let totalCost = 0;
    let totalCommission = 0;

    const countryMap = new Map<string, number>();
    const sourceMap = new Map<string, number>();

    for (const sale of sales) {
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

    const conversions = sales.length;
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
