import { randomUUID } from "node:crypto";
import type { Setting, SettingScope, SettingsStore } from "./types.js";

function compositeKeyFor(scope: SettingScope, key: string, userId?: string): string {
  return scope === "system" ? `system:${key}` : `user:${userId}:${key}`;
}

/** In-memory settings store for unit tests and local scripts. The api-server always wires up `DrizzleSettingsStore`. */
export class InMemorySettingsStore implements SettingsStore {
  private readonly settings = new Map<string, Setting>();

  async upsert(scope: SettingScope, key: string, value: unknown, userId?: string): Promise<Setting> {
    const compositeKey = compositeKeyFor(scope, key, userId);
    const existing = this.settings.get(compositeKey);
    const now = new Date().toISOString();
    const setting: Setting = existing
      ? { ...existing, value, updatedAt: now }
      : { id: randomUUID(), scope, key, ...(userId ? { userId } : {}), value, createdAt: now, updatedAt: now };
    this.settings.set(compositeKey, setting);
    return { ...setting };
  }

  async get(scope: SettingScope, key: string, userId?: string): Promise<Setting | null> {
    const setting = this.settings.get(compositeKeyFor(scope, key, userId));
    return setting ? { ...setting } : null;
  }

  async delete(scope: SettingScope, key: string, userId?: string): Promise<boolean> {
    return this.settings.delete(compositeKeyFor(scope, key, userId));
  }

  async list(scope: SettingScope, userId?: string): Promise<Setting[]> {
    return Array.from(this.settings.values())
      .filter((s) => s.scope === scope && (scope !== "user" || !userId || s.userId === userId))
      .map((s) => ({ ...s }));
  }
}
