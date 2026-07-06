import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { SettingsManager, InvalidSettingScopeError } from "./settings-manager.js";
import { InMemorySettingsStore } from "./in-memory-store.js";

describe("SettingsManager — system scope", () => {
  test("set()/get() round-trip a system setting", async () => {
    const manager = new SettingsManager(new InMemorySettingsStore());
    await manager.set("system", "maintenance_mode", { enabled: true });
    const setting = await manager.get("system", "maintenance_mode");
    assert.deepEqual(setting?.value, { enabled: true });
  });

  test("set() upserts — a second call with the same key updates, not duplicates", async () => {
    const manager = new SettingsManager(new InMemorySettingsStore());
    await manager.set("system", "theme", "dark");
    await manager.set("system", "theme", "light");
    assert.equal((await manager.get("system", "theme"))?.value, "light");
    assert.equal((await manager.list("system")).length, 1);
  });

  test("throws InvalidSettingScopeError if a userId is given for system scope", async () => {
    const manager = new SettingsManager(new InMemorySettingsStore());
    await assert.rejects(() => manager.set("system", "x", 1, "user-1"), InvalidSettingScopeError);
    await assert.rejects(() => manager.get("system", "x", "user-1"), InvalidSettingScopeError);
    await assert.rejects(() => manager.list("system", "user-1"), InvalidSettingScopeError);
  });

  test("delete() removes a system setting", async () => {
    const manager = new SettingsManager(new InMemorySettingsStore());
    await manager.set("system", "flag", true);
    assert.equal(await manager.delete("system", "flag"), true);
    assert.equal(await manager.get("system", "flag"), null);
  });
});

describe("SettingsManager — user scope", () => {
  test("set()/get() round-trip a user setting, scoped per user", async () => {
    const manager = new SettingsManager(new InMemorySettingsStore());
    await manager.set("user", "locale", "en-US", "user-1");
    await manager.set("user", "locale", "fr-FR", "user-2");

    assert.equal((await manager.get("user", "locale", "user-1"))?.value, "en-US");
    assert.equal((await manager.get("user", "locale", "user-2"))?.value, "fr-FR");
  });

  test("throws InvalidSettingScopeError when userId is missing for user scope", async () => {
    const manager = new SettingsManager(new InMemorySettingsStore());
    await assert.rejects(() => manager.set("user", "x", 1), InvalidSettingScopeError);
    await assert.rejects(() => manager.get("user", "x"), InvalidSettingScopeError);
    await assert.rejects(() => manager.list("user"), InvalidSettingScopeError);
  });

  test("list() returns only the given user's settings", async () => {
    const manager = new SettingsManager(new InMemorySettingsStore());
    await manager.set("user", "a", 1, "user-1");
    await manager.set("user", "b", 2, "user-1");
    await manager.set("user", "a", 1, "user-2");

    assert.equal((await manager.list("user", "user-1")).length, 2);
    assert.equal((await manager.list("user", "user-2")).length, 1);
  });

  test("delete() only removes the specified user's setting", async () => {
    const manager = new SettingsManager(new InMemorySettingsStore());
    await manager.set("user", "k", 1, "user-1");
    await manager.set("user", "k", 2, "user-2");

    assert.equal(await manager.delete("user", "k", "user-1"), true);
    assert.equal(await manager.get("user", "k", "user-1"), null);
    assert.equal((await manager.get("user", "k", "user-2"))?.value, 2);
  });
});
