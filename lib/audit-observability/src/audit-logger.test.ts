import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { AuditLogger } from "./audit-logger.js";
import { InMemoryAuditLogStore } from "./in-memory-store.js";

describe("AuditLogger", () => {
  test("record() stores a full entry with a generated id and timestamp", async () => {
    const logger = new AuditLogger(new InMemoryAuditLogStore());
    const entry = await logger.record({
      action: "rule.created",
      resourceType: "rule",
      resourceId: "rule-1",
      actorUserId: "user-1",
      actorRole: "admin",
      ipAddress: "127.0.0.1",
      metadata: { name: "escalate-failures" },
    });

    assert.ok(entry.id);
    assert.ok(entry.createdAt);
    assert.equal(entry.action, "rule.created");
    assert.equal(entry.resourceId, "rule-1");
    assert.deepEqual(entry.metadata, { name: "escalate-failures" });
  });

  test("record() works with only the required fields", async () => {
    const logger = new AuditLogger(new InMemoryAuditLogStore());
    const entry = await logger.record({ action: "auth.login", resourceType: "session" });
    assert.equal(entry.action, "auth.login");
    assert.equal(entry.actorUserId, undefined);
  });

  test("get() reads a stored entry by id, and returns null for a nonexistent one", async () => {
    const logger = new AuditLogger(new InMemoryAuditLogStore());
    const entry = await logger.record({ action: "tool.deleted", resourceType: "tool", resourceId: "t-1" });
    assert.equal((await logger.get(entry.id))?.id, entry.id);
    assert.equal(await logger.get("does-not-exist"), null);
  });

  test("list() filters by action, resourceType, resourceId, and actorUserId", async () => {
    const logger = new AuditLogger(new InMemoryAuditLogStore());
    await logger.record({ action: "rule.created", resourceType: "rule", resourceId: "r1", actorUserId: "u1" });
    await logger.record({ action: "rule.deleted", resourceType: "rule", resourceId: "r1", actorUserId: "u2" });
    await logger.record({ action: "agent.created", resourceType: "agent", resourceId: "a1", actorUserId: "u1" });

    assert.equal((await logger.list({})).length, 3);
    assert.equal((await logger.list({ action: "rule.created" })).length, 1);
    assert.equal((await logger.list({ resourceType: "rule" })).length, 2);
    assert.equal((await logger.list({ resourceId: "r1" })).length, 2);
    assert.equal((await logger.list({ actorUserId: "u1" })).length, 2);
  });

  test("list() returns most recent first", async () => {
    const logger = new AuditLogger(new InMemoryAuditLogStore());
    const first = await logger.record({ action: "a", resourceType: "x" });
    await new Promise((r) => setTimeout(r, 2));
    const second = await logger.record({ action: "b", resourceType: "x" });

    const results = await logger.list({});
    assert.equal(results[0]?.id, second.id);
    assert.equal(results[1]?.id, first.id);
  });
});
