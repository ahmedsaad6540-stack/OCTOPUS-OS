/**
 * The AI Provider Manager owns *provider configuration* and a uniform
 * `ProviderClient.complete()` seam over whichever vendor API a config
 * points at. It never stores a raw API key — only the name of the
 * environment variable that holds one — and it never imports
 * `@workspace/agent-manager` at compile time: `AgentLike`/`AgentLikeExecutor`
 * mirror `AgentDefinition`/`AgentExecutor`'s shapes exactly, the same
 * decoupling pattern `@workspace/rule-engine` uses for `@workspace/brain`.
 * `ProviderBackedAgentExecutor` (in `agent-executor-adapter.ts`) is what
 * the api-server wires into `AgentManager` as its real `AgentExecutor`.
 */

// ---------------------------------------------------------------------------
// Completion request/response — provider-agnostic
// ---------------------------------------------------------------------------

export interface CompletionMessage {
  role: "user" | "assistant";
  content: string;
}

export interface CompletionRequest {
  systemPrompt?: string;
  messages: CompletionMessage[];
  maxTokens?: number;
  temperature?: number;
}

export interface CompletionUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface CompletionResponse {
  content: string;
  model: string;
  stopReason: string | null;
  usage: CompletionUsage | null;
}

/** Uniform seam every provider client implements, regardless of vendor. */
export interface ProviderClient {
  complete(request: CompletionRequest): Promise<CompletionResponse>;
}

// ---------------------------------------------------------------------------
// Provider configuration (durable)
// ---------------------------------------------------------------------------

export type ProviderStatus = "active" | "disabled";

/** Built-in provider types this package ships a real `ProviderClient` for. Custom types can still be registered at runtime via `AiProviderManager.registerFactory()`. */
export const builtInProviderTypes = ["anthropic"] as const;
export type BuiltInProviderType = (typeof builtInProviderTypes)[number];

export interface AiProviderConfig {
  id: string;
  name: string;
  /** Which `ProviderClient` factory to use — one of `builtInProviderTypes`, or a custom type registered via `registerFactory()`. */
  providerType: string;
  model: string;
  /** Name of the environment variable holding the API key. The key itself is never stored or returned. */
  apiKeyEnvVar: string;
  /** Override the provider's default API base URL — for proxies or self-hosted gateways. */
  baseUrl?: string;
  isDefault: boolean;
  status: ProviderStatus;
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProviderInput {
  name: string;
  providerType: string;
  model: string;
  apiKeyEnvVar: string;
  baseUrl?: string;
  isDefault?: boolean;
  status?: ProviderStatus;
  userId?: string;
}

export type UpdateProviderInput = Partial<Omit<CreateProviderInput, "userId">>;

export interface ProviderListQuery {
  providerType?: string;
  status?: ProviderStatus;
  userId?: string;
  limit?: number;
}

export interface AiProviderConfigStore {
  insert(config: AiProviderConfig): Promise<AiProviderConfig>;
  update(id: string, config: AiProviderConfig): Promise<AiProviderConfig | null>;
  delete(id: string): Promise<boolean>;
  getById(id: string): Promise<AiProviderConfig | null>;
  getDefault(): Promise<AiProviderConfig | null>;
  list(query: ProviderListQuery): Promise<AiProviderConfig[]>;
}

export interface AiProviderManagerLogger {
  debug(obj: Record<string, unknown>, msg?: string): void;
  info(obj: Record<string, unknown>, msg?: string): void;
  warn(obj: Record<string, unknown>, msg?: string): void;
  error(obj: Record<string, unknown>, msg?: string): void;
}

// ---------------------------------------------------------------------------
// Agent Manager interop (decoupled — see file doc comment)
// ---------------------------------------------------------------------------

/** Mirrors `AgentDefinition` in `@workspace/agent-manager` structurally. */
export interface AgentLike {
  name: string;
  instructions: string;
  capabilities: string[];
}

/** Mirrors `AgentExecutor` in `@workspace/agent-manager` structurally — `ProviderBackedAgentExecutor` satisfies this, and `AgentManager` accepts it with no compile-time dependency in either direction. */
export interface AgentLikeExecutor {
  execute(agent: AgentLike, input: unknown): Promise<unknown>;
}
