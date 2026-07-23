import test from "node:test";
import assert from "node:assert";
import { AmazonAdapter } from "./amazon.js";

test("AmazonAdapter fallback simulation test", async () => {
  const adapter = new AmazonAdapter({
    accessKey: "mock-key",
    secretKey: "mock-secret",
    partnerTag: "test-tag"
  });

  const products = await adapter.fetchProducts("electronics", { limit: 2 });
  
  assert.strictEqual(products.length, 2);
  assert.strictEqual(products[0].affiliateNetwork, "amazon");
  assert.ok(products[0].productUrl.includes("tag=test-tag"));
  assert.strictEqual(products[0].commissionRate, 4);
});

test("AmazonAdapter validateApiKey works", async () => {
  const validAdapter = new AmazonAdapter({ accessKey: "key", secretKey: "secret" });
  assert.strictEqual(await validAdapter.validateApiKey(), true);

  const invalidAdapter = new AmazonAdapter();
  assert.strictEqual(await invalidAdapter.validateApiKey(), false);
});
