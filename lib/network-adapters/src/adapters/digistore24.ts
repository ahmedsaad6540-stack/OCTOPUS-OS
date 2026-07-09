import { randomUUID } from "node:crypto";
import type { AffiliateNetworkAdapter, AffiliateProduct, FetchOptions } from "../types.js";

export class Digistore24Adapter implements AffiliateNetworkAdapter {
  readonly name = "digistore24";
  constructor(private readonly apiKey?: string) {}

  async fetchProducts(niche: string, options: FetchOptions = {}): Promise<AffiliateProduct[]> {
    const { limit = 10, minCommission = 0 } = options;
    const mockProducts: AffiliateProduct[] = [
      { id: randomUUID(), name: `${niche} Masterclass`, affiliateNetwork: "digistore24", commissionRate: 65, epc: 2.30, productUrl: `https://www.digistore24.com/${niche}-masterclass`, niche },
      { id: randomUUID(), name: `${niche} Digital Bundle`, affiliateNetwork: "digistore24", commissionRate: 55, epc: 1.90, productUrl: `https://www.digistore24.com/${niche}-bundle`, niche },
    ];
    return mockProducts.filter(p => p.commissionRate >= minCommission).slice(0, limit);
  }
}
