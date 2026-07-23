import { randomUUID } from "node:crypto";
import { validateAgainstSchema } from "./schema-validator.js";
import type {
  CreateToolInput,
  EventPublisher,
  ToolDefinition,
  ToolDefinitionStore,
  ToolHandler,
  ToolListQuery,
  ToolManagerLogger,
  UpdateToolInput,
} from "./types.js";

const noopLogger: ToolManagerLogger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};

/** Thrown by `invoke()` when no tool with that name exists. */
export class ToolNotFoundError extends Error {
  constructor(name: string) {
    super(`Tool "${name}" does not exist`);
    this.name = "ToolNotFoundError";
  }
}

/** Thrown by `invoke()` when the tool exists but is disabled. */
export class ToolDisabledError extends Error {
  constructor(name: string) {
    super(`Tool "${name}" is disabled`);
    this.name = "ToolDisabledError";
  }
}

/** Thrown by `invoke()` when input fails the tool's `inputSchema`. */
export class ToolInputValidationError extends Error {
  constructor(
    public readonly toolName: string,
    public readonly errors: string[],
  ) {
    super(`Input for tool "${toolName}" failed validation: ${errors.join("; ")}`);
    this.name = "ToolInputValidationError";
  }
}

/** Thrown by `invoke()` when the tool's `handlerName` has no registered handler. */
export class UnknownToolHandlerError extends Error {
  constructor(handlerName: string) {
    super(`No handler registered for "${handlerName}"`);
    this.name = "UnknownToolHandlerError";
  }
}

/**
 * Tool registry, lifecycle, and schema-validated invocation. A
 * `ToolDefinition` is data (name, description, input schema, which handler
 * runs it); a `ToolHandler` is code, registered in-process by whoever
 * integrates that specific tool. `invoke()` is the one path from "an agent
 * (or anything else) wants to run a tool" to "the handler actually ran" —
 * schema validation always happens first, so a handler never has to guard
 * against malformed input itself.
 */
export class ToolManager {
  private readonly handlers = new Map<string, ToolHandler>();

  constructor(
    private readonly store: ToolDefinitionStore,
    private readonly eventPublisher?: EventPublisher,
    private readonly logger: ToolManagerLogger = noopLogger,
  ) {}

  /** Registers (or replaces) the handler that runs every tool whose `handlerName` matches. */
  registerHandler(handlerName: string, handler: ToolHandler): void {
    this.handlers.set(handlerName, handler);
  }

  async create(input: CreateToolInput): Promise<ToolDefinition> {
    const now = new Date().toISOString();
    const tool: ToolDefinition = {
      id: randomUUID(),
      name: input.name,
      description: input.description,
      inputSchema: input.inputSchema,
      handlerName: input.handlerName,
      status: input.status ?? "active",
      ...(input.userId ? { userId: input.userId } : {}),
      createdAt: now,
      updatedAt: now,
    };
    return this.store.insert(tool);
  }

  async update(id: string, input: UpdateToolInput): Promise<ToolDefinition | null> {
    const existing = await this.store.getById(id);
    if (!existing) return null;

    const updated: ToolDefinition = {
      ...existing,
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.inputSchema !== undefined ? { inputSchema: input.inputSchema } : {}),
      ...(input.handlerName !== undefined ? { handlerName: input.handlerName } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      updatedAt: new Date().toISOString(),
    };
    return this.store.update(id, updated);
  }

  async delete(id: string): Promise<boolean> {
    return this.store.delete(id);
  }

  async enable(id: string): Promise<ToolDefinition | null> {
    return this.update(id, { status: "active" });
  }

  async disable(id: string): Promise<ToolDefinition | null> {
    return this.update(id, { status: "disabled" });
  }

  async get(id: string): Promise<ToolDefinition | null> {
    return this.store.getById(id);
  }

  async getByName(name: string): Promise<ToolDefinition | null> {
    return this.store.getByName(name);
  }

  async list(query: ToolListQuery = {}): Promise<ToolDefinition[]> {
    return this.store.list(query);
  }

  /**
   * Validates `input` against the named tool's `inputSchema` and, if it
   * passes, runs the registered handler. Throws `ToolNotFoundError`,
   * `ToolDisabledError`, `ToolInputValidationError`, or
   * `UnknownToolHandlerError` before ever calling the handler — none of
   * those produce a `tool.invoked`/`tool.failed` event, since nothing was
   * actually attempted. Once the handler runs, success or failure is
   * always broadcast (best-effort; a broadcast failure never masks the
   * real result).
   */
  async invoke(name: string, input: unknown, userId?: string): Promise<unknown> {
    const tool = await this.store.getByName(name);
    if (!tool) throw new ToolNotFoundError(name);
    if (tool.status !== "active") throw new ToolDisabledError(name);

    const validation = validateAgainstSchema(tool.inputSchema, input);
    if (!validation.valid) throw new ToolInputValidationError(name, validation.errors);

    const handler = this.handlers.get(tool.handlerName);
    if (!handler) throw new UnknownToolHandlerError(tool.handlerName);

    try {
      const output = await handler.execute(input);
      await this.broadcast("tool.invoked", { toolName: name, input, output }, userId);
      this.logger.info({ toolName: name }, "tool_manager.invoked");
      return output;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await this.broadcast("tool.failed", { toolName: name, input, error: message }, userId);
      this.logger.error({ toolName: name, error: message }, "tool_manager.failed");
      throw err;
    }
  }

  private async broadcast(type: string, payload: unknown, userId?: string): Promise<void> {
    if (!this.eventPublisher) return;
    try {
      await this.eventPublisher.publish(type, "os-core:tool-manager", payload, userId ? { userId } : {});
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error({ type, error: message }, "tool_manager.broadcast_failed");
    }
  }
}
