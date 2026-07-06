/**
 * Key-value settings at two scopes: `system` (one value per key, shared by
 * everyone — feature flags, defaults) and `user` (one value per key per
 * user — personal preferences). Both live in the same table, disambiguated
 * by a `compositeKey` the store computes (`system:<key>` or
 * `user:<userId>:<key>`) and enforces uniqueness on at the database level,
 * so "set" is a genuine upsert with no race between "check if it exists"
 * and "insert" — one `INSERT ... ON CONFLICT` style operation, not a
 * read-then-write.
 */

export type SettingScope = "system" | "user";

export interface Setting {
  id: string;
  scope: SettingScope;
  key: string;
  /** Required when `scope` is `"user"`; must be absent when `scope` is `"system"`. */
  userId?: string;
  value: unknown;
  createdAt: string;
  updatedAt: string;
}

export interface SettingsStore {
  /** Upserts by `(scope, key, userId)` — inserts if no matching row exists, otherwise updates `value`/`updatedAt` in place. */
  upsert(scope: SettingScope, key: string, value: unknown, userId?: string): Promise<Setting>;
  get(scope: SettingScope, key: string, userId?: string): Promise<Setting | null>;
  delete(scope: SettingScope, key: string, userId?: string): Promise<boolean>;
  /** Every setting in `scope`; for `"user"`, only that `userId`'s settings. */
  list(scope: SettingScope, userId?: string): Promise<Setting[]>;
}

export interface SettingsLogger {
  debug(obj: Record<string, unknown>, msg?: string): void;
  info(obj: Record<string, unknown>, msg?: string): void;
  warn(obj: Record<string, unknown>, msg?: string): void;
  error(obj: Record<string, unknown>, msg?: string): void;
}
