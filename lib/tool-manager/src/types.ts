/**
 * The Tool Manager owns tool *registration and invocation* — what a tool
 * is called, what input it accepts, and how to run it — the same
 * registration/execution split every other manager in this system uses
 * (Agent Manager/AgentExecutor, AI Provider Manager/ProviderClient). A
 * `ToolDefinition`'s `inputSchema` is validated against on every
 * `invoke()`, and its `handlerName` is resolved against handlers
 * registered in-process via `registerHandler()` — a tool definition is
 * data, but what it *does* is always code registered by whoever integrates
 * that specific tool, never something reconstructed from stored data.
 *
 * Decoupled from `@workspace/event-bus` at compile time the same way
 * `Brain`/`TaskQueue` are: `EventPublisher` mirrors `EventBus.publish`'s
 * signature exactly. Publishing `tool.invoked`/`tool.failed` is optional
 * (best-effort) and never blocks or fails an invocation.
 */

// ---------------------------------------------------------------------------
// Minimal JSON-Schema-like input validation
// ---------------------------------------------------------------------------

export type JsonSchemaType = "string" | "number" | "boolean" | "object" | "array";

/**
 * A deliberately small subset of JSON Schema — enough to validate realistic
 * tool inputs (primitive types, enums, required object properties, array
 * item types) without pulling in a general-purpose schema engine or
 * supporting the parts of JSON Schema (`$ref`, `oneOf`, custom formats...)
 * that would make a stored definition capable of expressing more than
 * "is this input shaped correctly".
 */
export interface JsonSchema {
  type: JsonSchemaType;
  description?: string;
  enum?: unknown[];
  properties?: Record<string, JsonSchema>;
  required?: string[];
  items?: JsonSchema;
}

export interface SchemaValidationResult {
  valid: boolean;
  errors: string[];
}

// ---------------------------------------------------------------------------
// Tool definitions
// ---------------------------------------------------------------------------

export type ToolStatus = "active" | "disabled";

export interface ToolDefinition {
  id: string;
  /** Unique invocation key — what `invoke()` and an agent's `capabilities` entries reference. */
  name: string;
  description: string;
  inputSchema: JsonSchema;
  /** Which registered `ToolHandler` actually runs this tool. Not validated to exist at create/update time — only at `invoke()`, same as `AiProviderConfig.providerType` in `@workspace/ai-provider-manager`. */
  handlerName: string;
  status: ToolStatus;
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateToolInput {
  name: string;
  description: string;
  inputSchema: JsonSchema;
  handlerName: string;
  status?: ToolStatus;
  userId?: string;
}

export type UpdateToolInput = Partial<Omit<CreateToolInput, "userId">>;

export interface ToolListQuery {
  status?: ToolStatus;
  handlerName?: string;
  userId?: string;
  limit?: number;
}

export interface ToolDefinitionStore {
  insert(tool: ToolDefinition): Promise<ToolDefinition>;
  update(id: string, tool: ToolDefinition): Promise<ToolDefinition | null>;
  delete(id: string): Promise<boolean>;
  getById(id: string): Promise<ToolDefinition | null>;
  getByName(name: string): Promise<ToolDefinition | null>;
  list(query: ToolListQuery): Promise<ToolDefinition[]>;
}

// ---------------------------------------------------------------------------
// Handlers (extension point — registered by whoever integrates a tool)
// ---------------------------------------------------------------------------

/** Must throw on failure rather than returning a sentinel — `ToolManager.invoke()` treats any thrown error as the invocation failing. */
export interface ToolHandler {
  execute(input: unknown): Promise<unknown>;
}

export type ToolHandlerFactory = () => ToolHandler;

// ---------------------------------------------------------------------------
// Event Bus interop (decoupled — see file doc comment)
// ---------------------------------------------------------------------------

export interface EventPublisher {
  publish<TPayload = unknown>(
    type: string,
    source: string,
    payload: TPayload,
    options?: {
      correlationId?: string;
      causationId?: string;
      userId?: string;
      version?: number;
    },
  ): Promise<unknown>;
}

export interface ToolManagerLogger {
  debug(obj: Record<string, unknown>, msg?: string): void;
  info(obj: Record<string, unknown>, msg?: string): void;
  warn(obj: Record<string, unknown>, msg?: string): void;
  error(obj: Record<string, unknown>, msg?: string): void;
}
