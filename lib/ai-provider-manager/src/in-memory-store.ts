import type { AiProviderConfig, AiProviderConfigStore, ProviderListQuery } from "./types.js";

/** In-memory provider config store for unit tests and local scripts. The api-server always wires up `DrizzleProviderConfigStore`. */
export class InMemoryProviderConfigStore implements AiProviderConfigStore {
  private readonly configs = new Map<string, AiProviderConfig>();

  async insert(config: AiProviderConfig): Promise<AiProviderConfig> {
    this.configs.set(config.id, { ...config });
    return { ...config };
  }

  async update(id: string, config: AiProviderConfig): Promise<AiProviderConfig | null> {
    if (!this.configs.has(id)) return null;
    this.configs.set(id, { ...config });
    return { ...config };
  }

  async delete(id: string): Promise<boolean> {
    return this.configs.delete(id);
  }

  async getById(id: string): Promise<AiProviderConfig | null> {
    const config = this.configs.get(id);
    return config ? { ...config } : null;
  }

  async getDefault(): Promise<AiProviderConfig | null> {
    const match = Array.from(this.configs.values()).find((c) => c.isDefault && c.status === "active");
    return match ? { ...match } : null;
  }

  async list(query: ProviderListQuery): Promise<AiProviderConfig[]> {
    let results = Array.from(this.configs.values());
    if (query.providerType) results = results.filter((c) => c.providerType === query.providerType);
    if (query.status) results = results.filter((c) => c.status === query.status);
    if (query.userId) results = results.filter((c) => c.userId === query.userId);
    results.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    const safeLimit = typeof query.limit === "number" && Number.isFinite(query.limit) ? query.limit : 100;
    return results.slice(0, Math.min(Math.max(safeLimit, 1), 500)).map((c) => ({ ...c }));
  }
}
