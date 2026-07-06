import type { Setting, SettingScope, SettingsLogger, SettingsStore } from "./types.js";

const noopLogger: SettingsLogger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};

/** Thrown when a `"user"`-scoped call is missing `userId`, or a `"system"`-scoped call is given one. */
export class InvalidSettingScopeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidSettingScopeError";
  }
}

function assertScope(scope: SettingScope, userId: string | undefined): void {
  if (scope === "user" && !userId) {
    throw new InvalidSettingScopeError('userId is required for "user"-scoped settings');
  }
  if (scope === "system" && userId) {
    throw new InvalidSettingScopeError('userId must not be provided for "system"-scoped settings');
  }
}

/**
 * Thin validation layer over `SettingsStore`: enforces that `"user"` scope
 * always carries a `userId` and `"system"` scope never does, then delegates
 * straight through. No caching, no defaults, no schema for what a `key` or
 * `value` should look like — this is deliberately a generic key-value
 * store, not a typed configuration system; callers own the meaning of
 * their own keys.
 */
export class SettingsManager {
  constructor(
    private readonly store: SettingsStore,
    private readonly logger: SettingsLogger = noopLogger,
  ) {}

  async set(scope: SettingScope, key: string, value: unknown, userId?: string): Promise<Setting> {
    assertScope(scope, userId);
    const setting = await this.store.upsert(scope, key, value, userId);
    this.logger.info({ scope, key, userId }, "settings.set");
    return setting;
  }

  async get(scope: SettingScope, key: string, userId?: string): Promise<Setting | null> {
    assertScope(scope, userId);
    return this.store.get(scope, key, userId);
  }

  async delete(scope: SettingScope, key: string, userId?: string): Promise<boolean> {
    assertScope(scope, userId);
    return this.store.delete(scope, key, userId);
  }

  async list(scope: SettingScope, userId?: string): Promise<Setting[]> {
    if (scope === "user" && !userId) {
      throw new InvalidSettingScopeError('userId is required to list "user"-scoped settings');
    }
    if (scope === "system" && userId) {
      throw new InvalidSettingScopeError('userId must not be provided when listing "system"-scoped settings');
    }
    return this.store.list(scope, userId);
  }
}
