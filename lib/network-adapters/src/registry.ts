import type { AffiliateNetworkAdapter } from "./types.js";

export class AdapterRegistry {
  private readonly adapters = new Map<string, AffiliateNetworkAdapter>();

  register(adapter: AffiliateNetworkAdapter): this {
    this.adapters.set(adapter.name, adapter);
    return this;
  }

  get(name: string): AffiliateNetworkAdapter | undefined {
    return this.adapters.get(name);
  }

  getAll(): AffiliateNetworkAdapter[] {
    return Array.from(this.adapters.values());
  }

  has(name: string): boolean {
    return this.adapters.has(name);
  }

  listNames(): string[] {
    return Array.from(this.adapters.keys());
  }

  async fetchFromAll(niche: string, minCommission = 0) {
    const results = await Promise.allSettled(
      this.getAll().map(a => a.fetchProducts(niche, { minCommission }))
    );
    return results
      .filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<AffiliateNetworkAdapter['fetchProducts']>>> => r.status === 'fulfilled')
      .flatMap(r => r.value)
      .sort((a, b) => b.epc - a.epc);
  }
}
