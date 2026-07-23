import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  ToolManager,
  ToolNotFoundError,
  ToolDisabledError,
  ToolInputValidationError,
  UnknownToolHandlerError,
} from "./tool-manager.js";
import { InMemoryToolStore } from "./in-memory-store.js";
import type { EventPublisher, JsonSchema, ToolHandler } from "./types.js";

function createEchoHandler(): ToolHandler {
  return {
    async execute(input) {
      return { echoed: input };
    },
  };
}

function createTestBus() {
  const published: { type: string; source: string; payload: unknown }[] = [];
  const bus: EventPublisher = {
    async publish(type, source, payload) {
      published.push({ type, source, payload });
      return { id: "evt-1" };
    },
  };
  return { bus, published };
}

const stringSchema: JsonSchema = { type: "object", required: ["q"], properties: { q: { type: "string" } } };

describe("ToolManager — CRUD and lifecycle", () => {
  test("create() defaults status to active", async () => {
    const manager = new ToolManager(new InMemoryToolStore());
    const tool = await manager.create({ name: "search", description: "x", inputSchema: stringSchema, handlerName: "search-handler" });
    assert.equal(tool.status, "active");
  });

  test("enable()/disable() toggle status", async () => {
    const manager = new ToolManager(new InMemoryToolStore());
    const tool = await manager.create({ name: "search", description: "x", inputSchema: stringSchema, handlerName: "h" });
    await manager.disable(tool.id);
    assert.equal((await manager.get(tool.id))?.status, "disabled");
    await manager.enable(tool.id);
    assert.equal((await manager.get(tool.id))?.status, "active");
  });

  test("delete() removes the tool", async () => {
    const manager = new ToolManager(new InMemoryToolStore());
    const tool = await manager.create({ name: "search", description: "x", inputSchema: stringSchema, handlerName: "h" });
    assert.equal(await manager.delete(tool.id), true);
    assert.equal(await manager.get(tool.id), null);
  });

  test("getByName() and list() work", async () => {
    const manager = new ToolManager(new InMemoryToolStore());
    await manager.create({ name: "search", description: "x", inputSchema: stringSchema, handlerName: "h" });
    assert.equal((await manager.getByName("search"))?.name, "search");
    assert.equal((await manager.list({})).length, 1);
  });
});

describe("ToolManager — invoke()", () => {
  test("throws ToolNotFoundError for an unregistered tool name", async () => {
    const manager = new ToolManager(new InMemoryToolStore());
    await assert.rejects(() => manager.invoke("does-not-exist", {}), ToolNotFoundError);
  });

  test("throws ToolDisabledError for a disabled tool", async () => {
    const manager = new ToolManager(new InMemoryToolStore());
    manager.registerHandler("h", createEchoHandler());
    await manager.create({ name: "search", description: "x", inputSchema: stringSchema, handlerName: "h", status: "disabled" });
    await assert.rejects(() => manager.invoke("search", { q: "hi" }), ToolDisabledError);
  });

  test("throws ToolInputValidationError for input that fails the schema", async () => {
    const manager = new ToolManager(new InMemoryToolStore());
    manager.registerHandler("h", createEchoHandler());
    await manager.create({ name: "search", description: "x", inputSchema: stringSchema, handlerName: "h" });
    await assert.rejects(() => manager.invoke("search", { q: 123 }), ToolInputValidationError);
  });

  test("throws UnknownToolHandlerError when the handlerName has no registered handler", async () => {
    const manager = new ToolManager(new InMemoryToolStore());
    await manager.create({ name: "search", description: "x", inputSchema: stringSchema, handlerName: "never-registered" });
    await assert.rejects(() => manager.invoke("search", { q: "hi" }), UnknownToolHandlerError);
  });

  test("runs the handler and returns its output on valid input", async () => {
    const manager = new ToolManager(new InMemoryToolStore());
    manager.registerHandler("h", createEchoHandler());
    await manager.create({ name: "search", description: "x", inputSchema: stringSchema, handlerName: "h" });

    const result = await manager.invoke("search", { q: "hello" });
    assert.deepEqual(result, { echoed: { q: "hello" } });
  });

  test("propagates a handler's thrown error", async () => {
    const manager = new ToolManager(new InMemoryToolStore());
    manager.registerHandler("h", {
      async execute() {
        throw new Error("handler exploded");
      },
    });
    await manager.create({ name: "search", description: "x", inputSchema: stringSchema, handlerName: "h" });
    await assert.rejects(() => manager.invoke("search", { q: "hi" }), /handler exploded/);
  });
});

describe("ToolManager — event broadcasting", () => {
  test("publishes tool.invoked on success", async () => {
    const { bus, published } = createTestBus();
    const manager = new ToolManager(new InMemoryToolStore(), bus);
    manager.registerHandler("h", createEchoHandler());
    await manager.create({ name: "search", description: "x", inputSchema: stringSchema, handlerName: "h" });

    await manager.invoke("search", { q: "hi" }, "user-1");

    assert.equal(published.length, 1);
    assert.equal(published[0]?.type, "tool.invoked");
    assert.equal(published[0]?.source, "os-core:tool-manager");
    assert.deepEqual(published[0]?.payload, { toolName: "search", input: { q: "hi" }, output: { echoed: { q: "hi" } } });
  });

  test("publishes tool.failed when the handler throws, and still propagates the error", async () => {
    const { bus, published } = createTestBus();
    const manager = new ToolManager(new InMemoryToolStore(), bus);
    manager.registerHandler("h", {
      async execute() {
        throw new Error("boom");
      },
    });
    await manager.create({ name: "search", description: "x", inputSchema: stringSchema, handlerName: "h" });

    await assert.rejects(() => manager.invoke("search", { q: "hi" }), /boom/);
    assert.equal(published.length, 1);
    assert.equal(published[0]?.type, "tool.failed");
  });

  test("does not publish anything for pre-execution failures (not found, disabled, invalid input, unknown handler)", async () => {
    const { bus, published } = createTestBus();
    const manager = new ToolManager(new InMemoryToolStore(), bus);
    manager.registerHandler("h", createEchoHandler());
    await manager.create({ name: "search", description: "x", inputSchema: stringSchema, handlerName: "h" });

    await assert.rejects(() => manager.invoke("nope", {}));
    await assert.rejects(() => manager.invoke("search", { q: 1 }));
    assert.equal(published.length, 0);
  });

  test("works with no EventPublisher configured at all", async () => {
    const manager = new ToolManager(new InMemoryToolStore());
    manager.registerHandler("h", createEchoHandler());
    await manager.create({ name: "search", description: "x", inputSchema: stringSchema, handlerName: "h" });
    const result = await manager.invoke("search", { q: "hi" });
    assert.deepEqual(result, { echoed: { q: "hi" } });
  });
});
