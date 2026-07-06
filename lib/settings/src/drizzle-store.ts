import { and, eq } from "drizzle-orm";
import { settingsTable, type SettingRecord } from "@workspace/db/schema";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { Setting, SettingScope, SettingsStore } from "./types.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = NodePgDatabase<any>;

function compositeKeyFor(scope: SettingScope, key: string, userId?: string): string {
  return scope === "system" ? `system:${key}` : `user:${userId}:${key}`;
}

function toSetting(record: SettingRecord): Setting {
  return {
    id: record.id,
    scope: record.scope as SettingScope,
    key: record.key,
    ...(record.userId ? { userId: record.userId } : {}),
    value: record.value,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export class DrizzleSettingsStore implements SettingsStore {
  constructor(private readonly db: Db) {}

  async upsert(scope: SettingScope, key: string, value: unknown, userId?: string): Promise<Setting> {
    const compositeKey = compositeKeyFor(scope, key, userId);
    const now = new Date();
    const rows = await this.db
      .insert(settingsTable)
      .values({ scope, key, userId: userId ?? null, compositeKey, value, createdAt: now, updatedAt: now })
      .onConflictDoUpdate({
        target: settingsTable.compositeKey,
        set: { value, updatedAt: now },
      })
      .returning();
    return toSetting(rows[0]!);
  }

  async get(scope: SettingScope, key: string, userId?: string): Promise<Setting | null> {
    const compositeKey = compositeKeyFor(scope, key, userId);
    const rows = await this.db.select().from(settingsTable).where(eq(settingsTable.compositeKey, compositeKey)).limit(1);
    return rows[0] ? toSetting(rows[0]) : null;
  }

  async delete(scope: SettingScope, key: string, userId?: string): Promise<boolean> {
    const compositeKey = compositeKeyFor(scope, key, userId);
    const rows = await this.db.delete(settingsTable).where(eq(settingsTable.compositeKey, compositeKey)).returning();
    return rows.length > 0;
  }

  async list(scope: SettingScope, userId?: string): Promise<Setting[]> {
    const conditions = [eq(settingsTable.scope, scope)];
    if (scope === "user" && userId) conditions.push(eq(settingsTable.userId, userId));

    const rows = await this.db
      .select()
      .from(settingsTable)
      .where(and(...conditions));

    return rows.map(toSetting);
  }
}
