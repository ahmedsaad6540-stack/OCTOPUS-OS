import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { ObservabilityService } from "./observability-service.js";

describe("ObservabilityService", () => {
  test("getStatus() includes uptimeSeconds and a timestamp even with no probes registered", async () => {
    const service = new ObservabilityService();
    const status = await service.getStatus();
    assert.ok(status.timestamp);
    assert.equal(typeof status.uptimeSeconds, "number");
    assert.deepEqual(status.sections, {});
    assert.deepEqual(status.errors, {});
  });

  test("collects every registered probe's section", async () => {
    const service = new ObservabilityService();
    service.registerProbe({ name: "agents", collect: async () => ({ active: 3 }) });
    service.registerProbe({ name: "tasks", collect: async () => ({ pending: 7, failed: 1 }) });

    const status = await service.getStatus();
    assert.deepEqual(status.sections, { agents: { active: 3 }, tasks: { pending: 7, failed: 1 } });
    assert.deepEqual(status.errors, {});
  });

  test("a failing probe is captured in errors without stopping other probes", async () => {
    const service = new ObservabilityService();
    service.registerProbe({ name: "ok-probe", collect: async () => ({ value: 1 }) });
    service.registerProbe({
      name: "broken-probe",
      collect: async () => {
        throw new Error("db unavailable");
      },
    });

    const status = await service.getStatus();
    assert.deepEqual(status.sections, { "ok-probe": { value: 1 } });
    assert.equal(status.errors["broken-probe"], "db unavailable");
  });

  test("registerProbe() with the same name replaces the previous probe", async () => {
    const service = new ObservabilityService();
    service.registerProbe({ name: "x", collect: async () => ({ v: 1 }) });
    service.registerProbe({ name: "x", collect: async () => ({ v: 2 }) });

    const status = await service.getStatus();
    assert.deepEqual(status.sections["x"], { v: 2 });
  });
});
