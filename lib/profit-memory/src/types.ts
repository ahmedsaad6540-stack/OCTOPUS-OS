export interface SaleEvent {
  id: string;
  campaignId?: string;
  productName: string;
  affiliateNetwork: string;
  trafficSource: string;
  keyword?: string;
  country: string;
  revenue: number;
  commission: number;
  cost: number;
  roi: number;
  occurredAt: Date;
  userId?: string;
}

export type InsertSaleEvent = Omit<SaleEvent, 'id'>;

export interface AttributionRecord {
  productName: string;
  trafficSource: string;
  keyword?: string;
  country: string;
  revenue: number;
  conversions: number;
  avgRoi: number;
}

export interface ProfitMetrics {
  totalRevenue: number;
  totalCost: number;
  totalCommission: number;
  roi: number;
  epc: number;
  conversionRate: number;
  topProducts: AttributionRecord[];
  topCountries: { country: string; revenue: number }[];
  topSources: { source: string; revenue: number }[];
}

export interface ProfitMemoryStore {
  insertSale(sale: InsertSaleEvent): Promise<SaleEvent>;
  listSales(userId?: string, since?: Date): Promise<SaleEvent[]>;
  getAttribution(userId: string): Promise<AttributionRecord[]>;
  getMetrics(userId: string): Promise<ProfitMetrics>;
}
