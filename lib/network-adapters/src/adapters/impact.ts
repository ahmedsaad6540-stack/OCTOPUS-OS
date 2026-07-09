import { randomUUID } from "node:crypto";
import type { AffiliateNetworkAdapter, AffiliateProduct, FetchOptions } from "../types.js";

export class ImpactAdapter implements AffiliateNetworkAdapter {
  readonly name = "impact";
  constructor(private readonly accountSid?: string, private readonly authToken?: string) {}

  async fetchProducts(niche: string, options: FetchOptions = {}): Promise<AffiliateProduct[]> {
    const { limit = 10, minCommission = 0 } = options;
    const mockProducts: AffiliateProduct[] = [
      { id: randomUUID(), name: `${niche} SaaS Platform`, affiliateNetwork: "impact", commissionRate: 35, epc: 5.10, productUrl: `https://impact.com/${niche}-saas`, niche },
    ];
    return mockProducts.filter(p => p.commissionRate >= minCommission).slice(0, limit);
  }
}
