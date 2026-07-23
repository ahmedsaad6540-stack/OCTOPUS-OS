import { randomUUID } from "node:crypto";
import type { AffiliateNetworkAdapter, AffiliateProduct, FetchOptions } from "../types.js";

export class ClickbankAdapter implements AffiliateNetworkAdapter {
  readonly name = "clickbank";
  constructor(private readonly apiKey?: string) {}

  async fetchProducts(niche: string, options: FetchOptions = {}): Promise<AffiliateProduct[]> {
    const { limit = 10, minCommission = 0 } = options;
    const isMock = !this.apiKey || this.apiKey.toLowerCase().includes("mock");

    if (isMock) {
      const mockProducts: AffiliateProduct[] = [
        { id: randomUUID(), name: `${niche} Pro Course`, affiliateNetwork: "clickbank", commissionRate: 75, epc: 1.85, productUrl: `https://clickbank.com/${niche}-pro`, niche, gravity: 120 },
        { id: randomUUID(), name: `${niche} Blueprint System`, affiliateNetwork: "clickbank", commissionRate: 60, epc: 2.10, productUrl: `https://clickbank.com/${niche}-blueprint`, niche, gravity: 89 },
        { id: randomUUID(), name: `Ultimate ${niche} Guide`, affiliateNetwork: "clickbank", commissionRate: 50, epc: 1.40, productUrl: `https://clickbank.com/${niche}-guide`, niche, gravity: 55 },
      ];
      return mockProducts.filter(p => p.commissionRate >= minCommission).slice(0, limit);
    }

    try {
      // Real ClickBank API call
      // The Clickbank Marketplace API provides products list
      const url = `https://api.clickbank.com/rest/1.3/products/list?keyword=${encodeURIComponent(niche)}`;
      const res = await fetch(url, {
        headers: {
          "Accept": "application/json",
          "Authorization": this.apiKey!
        }
      });

      if (!res.ok) {
        throw new Error(`ClickBank API returned status ${res.status}`);
      }

      const data = await res.json() as any;
      const products = data.products?.product || [];

      return products.map((p: any) => ({
        id: String(p.id || p.sku || randomUUID()),
        name: p.title || p.description || "ClickBank Product",
        affiliateNetwork: "clickbank",
        commissionRate: p.commission ? Number(p.commission) : 50, // default 50%
        epc: p.epc || 1.0,
        productUrl: p.hoplink || `https://${p.site}.hop.clickbank.net`,
        niche: p.category || niche,
        gravity: p.gravity || 0,
        description: p.description
      })).filter((p: any) => p.commissionRate >= minCommission).slice(0, limit);
    } catch (err) {
      console.error("[ClickbankAdapter] Failed to fetch real products:", err);
      return [];
    }
  }

  async validateApiKey(): Promise<boolean> {
    return !!this.apiKey;
  }
}
