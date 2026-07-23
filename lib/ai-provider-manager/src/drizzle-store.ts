import { and, desc, eq } from "drizzle-orm";
import { providerConfigsTable, type ProviderConfigRecord } from "@workspace/db/schema";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { AiProviderConfig, AiProviderConfigStore, ProviderListQuery, ProviderStatus } from "./types.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = NodePgDatabase<any>;

function toConfig(record: ProviderConfigRecord): AiProviderConfig {
  return {
    id: record.id,
    name: record.name,
    providerType: record.providerType,
    model: record.model,
    apiKeyEnvVar: record.apiKeyEnvVar,
    ...(record.baseUrl ? { baseUrl: record.baseUrl } : {}),
    isDefault: record.isDefault,
    status: record.status as ProviderStatus,
    ...(record.userId ? { userId: record.userId } : {}),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export class DrizzleProviderConfigStore implements AiProviderConfigStore {
  constructor(private readonly db: Db) {}

  async insert(config: AiProviderConfig): Promise<AiProviderConfig> {
    await this.db.insert(providerConfigsTable).values({
      id: config.id,
      name: config.name,
      providerType: config.providerType,
      model: config.model,
      apiKeyEnvVar: config.apiKeyEnvVar,
      baseUrl: config.baseUrl ?? null,
      isDefault: config.isDefault,
      status: config.status,
      userId: config.userId ?? null,
      createdAt: new Date(config.createdAt),
      updatedAt: new Date(config.updatedAt),
    });
    return config;
  }

  async update(id: string, config: AiProviderConfig): Promise<AiProviderConfig | null> {
    const rows = await this.db
      .update(providerConfigsTable)
      .set({
        name: config.name,
        providerType: config.providerType,
        model: config.model,
        apiKeyEnvVar: config.apiKeyEnvVar,
        baseUrl: config.baseUrl ?? null,
        isDefault: config.isDefault,
        status: config.status,
        updatedAt: new Date(config.updatedAt),
      })
      .where(eq(providerConfigsTable.id, id))
      .returning();
    return rows[0] ? toConfig(rows[0]) : null;
  }

  async delete(id: string): Promise<boolean> {
    const rows = await this.db.delete(providerConfigsTable).where(eq(providerConfigsTable.id, id)).returning();
    return rows.length > 0;
  }

  async getById(id: string): Promise<AiProviderConfig | null> {
    const rows = await this.db.select().from(providerConfigsTable).where(eq(providerConfigsTable.id, id)).limit(1);
    return rows[0] ? toConfig(rows[0]) : null;
  }

  async getDefault(): Promise<AiProviderConfig | null> {
    const rows = await this.db
      .select()
      .from(providerConfigsTable)
      .where(and(eq(providerConfigsTable.isDefault, true), eq(providerConfigsTable.status, "active")))
      .limit(1);
    return rows[0] ? toConfig(rows[0]) : null;
  }

  async list(query: ProviderListQuery): Promise<AiProviderConfig[]> {
    const conditions = [];
    if (query.providerType) conditions.push(eq(providerConfigsTable.providerType, query.providerType));
    if (query.status) conditions.push(eq(providerConfigsTable.status, query.status));
    if (query.userId) conditions.push(eq(providerConfigsTable.userId, query.userId));

    const rawLimit = query.limit;
    const safeLimit = typeof rawLimit === "number" && Number.isFinite(rawLimit) ? rawLimit : 100;

    const rows = await this.db
      .select()
      .from(providerConfigsTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(providerConfigsTable.createdAt))
      .limit(Math.min(Math.max(safeLimit, 1), 500));

    return rows.map(toConfig);
  }
}
