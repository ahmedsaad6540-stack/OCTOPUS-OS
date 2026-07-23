import { randomUUID } from "node:crypto";
import type { AffiliateNetworkAdapter, AffiliateProduct, FetchOptions } from "../types.js";

export class AwinAdapter implements AffiliateNetworkAdapter {
  readonly name = "awin";
  constructor(private readonly apiKey?: string) {}

  async fetchProducts(niche: string, options: FetchOptions = {}): Promise<AffiliateProduct[]> {
    const { limit = 10, minCommission = 0 } = options;
    const mockProducts: AffiliateProduct[] = [
      { id: randomUUID(), name: `${niche} Retail Program`, affiliateNetwork: "awin", commissionRate: 10, epc: 0.90, productUrl: `https://awin.com/${niche}-retail`, niche },
      { id: randomUUID(), name: `${niche} Fashion Brand`, affiliateNetwork: "awin", commissionRate: 12, epc: 1.10, productUrl: `https://awin.com/${niche}-fashion`, niche },
    ];
    return mockProducts.filter(p => p.commissionRate >= minCommission).slice(0, limit);
  }
}
