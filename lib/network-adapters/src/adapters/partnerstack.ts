import { randomUUID } from "node:crypto";
import type { AffiliateNetworkAdapter, AffiliateProduct, FetchOptions } from "../types.js";

export class PartnerStackAdapter implements AffiliateNetworkAdapter {
  readonly name = "partnerstack";
  constructor(private readonly apiKey?: string) {}

  async fetchProducts(niche: string, options: FetchOptions = {}): Promise<AffiliateProduct[]> {
    const { limit = 10, minCommission = 0 } = options;
    const mockProducts: AffiliateProduct[] = [
      { id: randomUUID(), name: `${niche} B2B SaaS`, affiliateNetwork: "partnerstack", commissionRate: 30, epc: 6.00, productUrl: `https://partnerstack.com/${niche}-b2b`, niche },
    ];
    return mockProducts.filter(p => p.commissionRate >= minCommission).slice(0, limit);
  }
}
