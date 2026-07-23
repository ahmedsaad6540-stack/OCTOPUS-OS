import test from "node:test";
import assert from "node:assert/strict";
import { AmazonAssociatesProvider } from "./AmazonAssociatesProvider.js";

test("AmazonAssociatesProvider Mock Validation", async (t) => {
  const provider = new AmazonAssociatesProvider();

  await t.test("1. Handles verifyConnection", async () => {
    const result = await provider.verifyConnection({ associateTag: "mytag-20" });
    assert.equal(result.authenticated, true);
    assert.equal(result.configured, true);
  });

  await t.test("2. Handles missing associate tag", async () => {
    const result = await provider.verifyConnection({});
    assert.equal(result.authenticated, false);
    assert.equal(result.configured, false);
  });

  await t.test("3. Import Product generated correct link", async () => {
    const product = await provider.importProduct({ productId: "B08N5WRWNW", productName: "MacBook Air" }, { associateTag: "mytag-20" });
    assert.equal(product.trackingUrl.includes("tag=mytag-20"), true);
    assert.equal(product.id, "B08N5WRWNW");
  });

  await t.test("4. Generate Tracking Link creates valid amazon link", async () => {
    const link = await provider.generateTrackingLink({ productId: "B08N5WRWNW" }, { associateTag: "mytag-20" });
    assert.equal(link.trackingUrl.includes("linkCode=ll1"), true);
    assert.ok(link.campaignKey.startsWith("oct_"));
  });

  await t.test("5. Validates Amazon URLs correctly", async () => {
    const res1 = await provider.validateTrackingLink("https://www.amazon.com/dp/123?tag=mytag-20", {});
    assert.equal(res1.isValid, true);
    
    const res2 = await provider.validateTrackingLink("https://amzn.to/12345", {});
    assert.equal(res2.isValid, true);
    
    const res3 = await provider.validateTrackingLink("https://google.com", {});
    assert.equal(res3.isValid, false);
  });
});
