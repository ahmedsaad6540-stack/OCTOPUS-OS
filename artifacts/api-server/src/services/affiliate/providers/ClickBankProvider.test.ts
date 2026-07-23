import test from "node:test";
import assert from "node:assert/strict";
import { ClickBankProvider } from "./ClickBankProvider.js";

test("ClickBankProvider Mock Validation", async (t) => {
  const provider = new ClickBankProvider();

  await t.test("1. Handles verifyConnection", async () => {
    const result = await provider.verifyConnection({ developerApiKey: "dev_key", clerkApiKey: "clerk_key", affiliateId: "aff" });
    assert.equal(result.authenticated, true);
    assert.equal(result.configured, true);
  });

  await t.test("2. Handles missing API keys", async () => {
    const result = await provider.verifyConnection({ affiliateId: "aff" });
    assert.equal(result.authenticated, false);
    assert.equal(result.configured, false);
  });

  await t.test("3. Generate Tracking Link creates valid hop link", async () => {
    const link = await provider.generateTrackingLink({ productId: "myvendor" }, { affiliateId: "myaffiliate" });
    assert.equal(link.trackingUrl.includes("hop.clickbank.net"), true);
    assert.equal(link.trackingUrl.includes("affiliate=myaffiliate"), true);
    assert.equal(link.trackingUrl.includes("vendor=myvendor"), true);
    assert.equal(link.trackingUrl.includes("tid=oct"), true);
  });

  await t.test("4. Validates ClickBank URLs correctly", async () => {
    const res1 = await provider.validateTrackingLink("https://hop.clickbank.net/?affiliate=a&vendor=v", {});
    assert.equal(res1.isValid, true);
    
    const res3 = await provider.validateTrackingLink("https://google.com", {});
    assert.equal(res3.isValid, false);
  });
});
