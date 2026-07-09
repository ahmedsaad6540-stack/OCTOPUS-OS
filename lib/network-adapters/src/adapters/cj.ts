import { randomUUID } from "node:crypto";
import type { AffiliateNetworkAdapter, AffiliateProduct, FetchOptions } from "../types.js";

export class CJAdapter implements AffiliateNetworkAdapter {
  readonly name = "cj";
  constructor(private readonly apiKey?: string) {}

  async fetchProducts(niche: string, options: FetchOptions = {}): Promise<AffiliateProduct[]> {
    const { limit = 10, minCommission = 0 } = options;
    const mockProducts: AffiliateProduct[] = [
      { id: randomUUID(), name: `${niche} Software Suite`, affiliateNetwork: "cj", commissionRate: 30, epc: 3.50, productUrl: `https://cj.com/${niche}-suite`, niche },
      { id: randomUUID(), name: `${niche} Enterprise Tool`, affiliateNetwork: "cj", commissionRate: 25, epc: 4.20, productUrl: `https://cj.com/${niche}-enterprise`, niche },
    ];
    return mockProducts.filter(p => p.commissionRate >= minCommission).slice(0, limit);
  }
}
