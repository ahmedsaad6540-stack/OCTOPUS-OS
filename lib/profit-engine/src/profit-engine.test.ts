import { test, describe } from "node:test";
import assert from "node:assert";
import { ProfitEngine } from "./profit-engine.js";

describe("ProfitEngine - Orchestrator", () => {
  test("Constructor - Initializes InMemory stores when db is absent", () => {
    const engine = new ProfitEngine();
    assert.ok(engine, "ProfitEngine should instantiate correctly");
    assert.ok(engine.profitMemory, "Should initialize profitMemory");
    assert.ok(engine.policyEngine, "Should initialize policyEngine");
    assert.ok(engine.adapters, "Should initialize adapters");
  });

  test("Happy Path - setMode() and getMode()", () => {
    const engine = new ProfitEngine();
    assert.strictEqual(engine.getMode(), "LEARNING");

    engine.setMode("AUTO");
    assert.strictEqual(engine.getMode(), "AUTO");
  });

  test("Happy Path - recordSale() uses LEARNING mode correctly", async () => {
    const engine = new ProfitEngine();
    
    // In LEARNING mode, it should not throw and should insert into the in-memory store
    const result = await engine.recordSale({
      productName: "Test Product",
      affiliateNetwork: "clickbank",
      trafficSource: "tiktok",
      country: "US",
      revenue: 100,
      commission: 50,
      cost: 20
    });

    assert.ok(result, "recordSale should return a truthy result");
    assert.strictEqual(result.productName, "Test Product");
    assert.strictEqual(result.roi, 400); // ((100 - 20) / 20) * 100 = 400
  });

  test("Validation Failure - Enforces Business Policies", async () => {
    const engine = new ProfitEngine();
    
    // Add a policy that always fails for testing
    engine.policyEngine.addPolicy({
      id: "always-fail",
      name: "Always Fail Policy",
      description: "Fails everything",
      evaluate: (ctx) => {
        return { kind: "block", policyId: "always-fail", reason: "Testing policy failure" };
      }
    });

    try {
      await engine.recordSale({
        productName: "Bad Product",
        affiliateNetwork: "clickbank",
        trafficSource: "tiktok",
        country: "US",
        revenue: 100,
        commission: 50,
        cost: 20
      });
      assert.fail("Should have thrown PolicyViolationError");
    } catch (e: any) {
      assert.match(e.message, /blocked by Business Policy Engine: \[always-fail\] Testing policy failure/);
    }
  });

  test("Dashboard - Fetches aggregated data correctly", async () => {
    const engine = new ProfitEngine();
    
    // Fetch dashboard for user 'user1'
    const dashboard = await engine.getDashboard("user1");
    
    assert.ok(dashboard, "Should return a dashboard object");
    assert.ok(Array.isArray(dashboard.bestProducts));
    assert.ok(Array.isArray(dashboard.pendingProposals));
    // epc and roi should be zero initially for empty in-memory store
    assert.strictEqual(dashboard.roi, 0);
  });
});
