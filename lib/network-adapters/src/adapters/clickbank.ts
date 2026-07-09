import { randomUUID } from "node:crypto";
import type { AffiliateNetworkAdapter, AffiliateProduct, FetchOptions } from "../types.js";

export class ClickbankAdapter implements AffiliateNetworkAdapter {
  readonly name = "clickbank";
  constructor(private readonly apiKey?: string) {}

  async fetchProducts(niche: string, options: FetchOptions = {}): Promise<AffiliateProduct[]> {
    const { limit = 10, minCommission = 0 } = options;
    const mockProducts: AffiliateProduct[] = [
      { id: randomUUID(), name: `${niche} Pro Course`, affiliateNetwork: "clickbank", commissionRate: 75, epc: 1.85, productUrl: `https://clickbank.com/${niche}-pro`, niche, gravity: 120 },
      { id: randomUUID(), name: `${niche} Blueprint System`, affiliateNetwork: "clickbank", commissionRate: 60, epc: 2.10, productUrl: `https://clickbank.com/${niche}-blueprint`, niche, gravity: 89 },
      { id: randomUUID(), name: `Ultimate ${niche} Guide`, affiliateNetwork: "clickbank", commissionRate: 50, epc: 1.40, productUrl: `https://clickbank.com/${niche}-guide`, niche, gravity: 55 },
    ];
    return mockProducts.filter(p => p.commissionRate >= minCommission).slice(0, limit);
  }

  async validateApiKey(): Promise<boolean> {
    return !!this.apiKey;
  }
}
