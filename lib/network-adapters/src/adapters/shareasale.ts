import { randomUUID } from "node:crypto";
import type { AffiliateNetworkAdapter, AffiliateProduct, FetchOptions } from "../types.js";

export class ShareASaleAdapter implements AffiliateNetworkAdapter {
  readonly name = "shareasale";
  constructor(private readonly apiToken?: string, private readonly apiSecret?: string) {}

  async fetchProducts(niche: string, options: FetchOptions = {}): Promise<AffiliateProduct[]> {
    const { limit = 10, minCommission = 0 } = options;
    const mockProducts: AffiliateProduct[] = [
      { id: randomUUID(), name: `${niche} Physical Product`, affiliateNetwork: "shareasale", commissionRate: 20, epc: 1.50, productUrl: `https://shareasale.com/${niche}-physical`, niche },
      { id: randomUUID(), name: `${niche} Subscription Box`, affiliateNetwork: "shareasale", commissionRate: 25, epc: 1.80, productUrl: `https://shareasale.com/${niche}-subscription`, niche },
    ];
    return mockProducts.filter(p => p.commissionRate >= minCommission).slice(0, limit);
  }
}
