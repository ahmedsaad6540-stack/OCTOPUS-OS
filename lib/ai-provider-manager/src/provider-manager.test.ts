import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { AiProviderManager, UnknownProviderTypeError, NoDefaultProviderError } from "./provider-manager.js";
import { InMemoryProviderConfigStore } from "./in-memory-store.js";
import type { ProviderClient } from "./types.js";

function createFakeClient(response: string): ProviderClient {
  return {
    async complete() {
      return { content: response, model: "fake-model", stopReason: "end_turn", usage: null };
    },
  };
}

describe("AiProviderManager — CRUD", () => {
  test("create() defaults isDefault/status", async () => {
    const manager = new AiProviderManager(new InMemoryProviderConfigStore());
    const config = await manager.create({ name: "x", providerType: "anthropic", model: "m", apiKeyEnvVar: "K" });
    assert.equal(config.isDefault, false);
    assert.equal(config.status, "active");
  });

  test("creating a second default clears the first", async () => {
    const manager = new AiProviderManager(new InMemoryProviderConfigStore());
    const first = await manager.create({ name: "a", providerType: "anthropic", model: "m", apiKeyEnvVar: "K", isDefault: true });
    const second = await manager.create({ name: "b", providerType: "anthropic", model: "m", apiKeyEnvVar: "K", isDefault: true });

    assert.equal((await manager.get(first.id))?.isDefault, false);
    assert.equal((await manager.get(second.id))?.isDefault, true);
  });

  test("update() to isDefault: true clears the previous default", async () => {
    const manager = new AiProviderManager(new InMemoryProviderConfigStore());
    const first = await manager.create({ name: "a", providerType: "anthropic", model: "m", apiKeyEnvVar: "K", isDefault: true });
    const second = await manager.create({ name: "b", providerType: "anthropic", model: "m", apiKeyEnvVar: "K" });

    await manager.update(second.id, { isDefault: true });
    assert.equal((await manager.get(first.id))?.isDefault, false);
    assert.equal((await manager.get(second.id))?.isDefault, true);
  });

  test("delete() removes the config", async () => {
    const manager = new AiProviderManager(new InMemoryProviderConfigStore());
    const config = await manager.create({ name: "a", providerType: "anthropic", model: "m", apiKeyEnvVar: "K" });
    assert.equal(await manager.delete(config.id), true);
    assert.equal(await manager.get(config.id), null);
  });

  test("list() filters by providerType and status", async () => {
    const manager = new AiProviderManager(new InMemoryProviderConfigStore());
    await manager.create({ name: "a", providerType: "anthropic", model: "m", apiKeyEnvVar: "K" });
    await manager.create({ name: "b", providerType: "custom", model: "m", apiKeyEnvVar: "K", status: "disabled" });

    assert.equal((await manager.list({})).length, 2);
    assert.equal((await manager.list({ providerType: "anthropic" })).length, 1);
    assert.equal((await manager.list({ status: "disabled" })).length, 1);
  });
});

describe("AiProviderManager — factory registry and completion", () => {
  test("getClient() resolves the built-in anthropic factory", async () => {
    const manager = new AiProviderManager(new InMemoryProviderConfigStore());
    const config = await manager.create({ name: "a", providerType: "anthropic", model: "m", apiKeyEnvVar: "K" });
    const client = manager.getClient(config);
    assert.equal(typeof client.complete, "function");
  });

  test("getClient() throws UnknownProviderTypeError for an unregistered type", async () => {
    const manager = new AiProviderManager(new InMemoryProviderConfigStore());
    const config = await manager.create({ name: "a", providerType: "made-up-vendor", model: "m", apiKeyEnvVar: "K" });
    assert.throws(() => manager.getClient(config), UnknownProviderTypeError);
  });

  test("registerFactory() adds a working custom provider type", async () => {
    const manager = new AiProviderManager(new InMemoryProviderConfigStore());
    manager.registerFactory("custom-vendor", () => createFakeClient("custom response"));
    const config = await manager.create({ name: "a", providerType: "custom-vendor", model: "m", apiKeyEnvVar: "K" });

    const response = await manager.complete(config.id, { messages: [{ role: "user", content: "hi" }] });
    assert.equal(response.content, "custom response");
  });

  test("complete() throws for a nonexistent config id", async () => {
    const manager = new AiProviderManager(new InMemoryProviderConfigStore());
    await assert.rejects(() => manager.complete("does-not-exist", { messages: [] }));
  });

  test("completeWithDefault() throws NoDefaultProviderError when none is set", async () => {
    const manager = new AiProviderManager(new InMemoryProviderConfigStore());
    await manager.create({ name: "a", providerType: "anthropic", model: "m", apiKeyEnvVar: "K" });
    await assert.rejects(() => manager.completeWithDefault({ messages: [] }), NoDefaultProviderError);
  });

  test("completeWithDefault() routes to the default config's client", async () => {
    const manager = new AiProviderManager(new InMemoryProviderConfigStore());
    manager.registerFactory("custom-vendor", () => createFakeClient("default response"));
    await manager.create({ name: "a", providerType: "custom-vendor", model: "m", apiKeyEnvVar: "K", isDefault: true });

    const response = await manager.completeWithDefault({ messages: [{ role: "user", content: "hi" }] });
    assert.equal(response.content, "default response");
  });
});
