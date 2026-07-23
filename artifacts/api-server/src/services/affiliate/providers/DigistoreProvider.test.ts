import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { DigistoreProvider } from "./DigistoreProvider.js";

test("DigistoreProvider HTTP Mock Validation", async (t) => {
  const app = express();
  app.use(express.json());

  let currentStatus = 200;
  let currentResponse: any = { result: "success" };

  app.post("/api/call", (req, res) => {
    const apiKey = req.headers["x-ds-api-key"];
    if (apiKey !== "valid_key" && currentStatus === 200) {
      res.status(200).json({ result: "error", message: "Invalid API key" });
      return;
    }
    res.status(currentStatus).json(currentResponse);
  });

  const server = app.listen(0);
  const port = (server.address() as any).port;
  
  // Override API base for testing
  DigistoreProvider.API_BASE = `http://localhost:${port}/api/call`;
  const provider = new DigistoreProvider();

  t.after(() => {
    server.close();
  });

  await t.test("1. Handles 200 OK (Success)", async () => {
    currentStatus = 200;
    currentResponse = { result: "success" };
    
    const result = await provider.verifyConnection({ apiKey: "valid_key" });
    assert.equal(result.authenticated, true);
    assert.equal(result.configured, true);
  });

  await t.test("2. Handles 200 OK (Invalid Key)", async () => {
    currentStatus = 200;
    currentResponse = { result: "success" }; // Won't be reached due to interceptor
    
    const result = await provider.verifyConnection({ apiKey: "invalid_key" });
    assert.equal(result.authenticated, false);
  });

  await t.test("3. Handles 429 Rate Limit Gracefully", async () => {
    currentStatus = 429;
    currentResponse = { result: "error", message: "Too many requests" };
    
    const result = await provider.verifyConnection({ apiKey: "valid_key" });
    assert.equal(result.authenticated, false);
    assert.equal(result.error, "Rate limit exceeded");
  });

  await t.test("4. Handles 500 Server Error Gracefully", async () => {
    currentStatus = 500;
    currentResponse = { result: "error", message: "Internal error" };
    
    const result = await provider.verifyConnection({ apiKey: "valid_key" });
    assert.equal(result.authenticated, false);
    assert.equal(result.error, "Provider server error: 500");
  });

  await t.test("5. Handles Network Timeout/Error Gracefully", async () => {
    // Override API base to an unreachable port
    DigistoreProvider.API_BASE = `http://localhost:1`;
    const result = await provider.verifyConnection({ apiKey: "valid_key" });
    
    assert.equal(result.authenticated, false);
    assert.ok(result.error?.includes("fetch failed") || result.error?.includes("ECONNREFUSED"), "Should catch network errors");
  });
});
