import { randomUUID } from "node:crypto";
import { AnthropicProviderClient } from "./anthropic-client.js";
import { GeminiProviderClient } from "./gemini-client.js";
import { OpenAiProviderClient } from "./openai-client.js";
import type {
  AiProviderConfig,
  AiProviderConfigStore,
  AiProviderManagerLogger,
  CompletionRequest,
  CompletionResponse,
  CreateProviderInput,
  ProviderClient,
  ProviderListQuery,
  UpdateProviderInput,
} from "./types.js";

const noopLogger: AiProviderManagerLogger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};

export type ProviderClientFactory = (config: AiProviderConfig) => ProviderClient;

const builtInFactories: Record<string, ProviderClientFactory> = {
  anthropic: (config) => new AnthropicProviderClient(config),
  gemini: (config) => new GeminiProviderClient(config),
  openai: (config) => new OpenAiProviderClient(config),
};

/** Thrown when a config's `providerType` has no registered factory. */
export class UnknownProviderTypeError extends Error {
  constructor(providerType: string) {
    super(`No ProviderClient factory registered for provider type "${providerType}"`);
    this.name = "UnknownProviderTypeError";
  }
}

/** Thrown when a completion is requested and there's no default provider configured. */
export class NoDefaultProviderError extends Error {
  constructor() {
    super("No default AI provider is configured");
    this.name = "NoDefaultProviderError";
  }
}

/**
 * Registry of AI provider configurations plus a uniform
 * `complete()`/`completeWithDefault()` call surface over whichever vendor a
 * config points at. Ships a real `ProviderClient` for Anthropic;
 * `registerFactory()` extends this to other vendors without touching
 * existing configs or callers.
 */
export class AiProviderManager {
  private readonly factories = new Map<string, ProviderClientFactory>(Object.entries(builtInFactories));

  constructor(
    private readonly store: AiProviderConfigStore,
    private readonly logger: AiProviderManagerLogger = noopLogger,
  ) {}

  /** Registers (or overrides) the `ProviderClient` factory for a provider type. */
  registerFactory(providerType: string, factory: ProviderClientFactory): void {
    this.factories.set(providerType, factory);
  }

  async create(input: CreateProviderInput): Promise<AiProviderConfig> {
    const now = new Date().toISOString();
    const config: AiProviderConfig = {
      id: randomUUID(),
      name: input.name,
      providerType: input.providerType,
      model: input.model,
      apiKeyEnvVar: input.apiKeyEnvVar,
      ...(input.baseUrl !== undefined ? { baseUrl: input.baseUrl } : {}),
      isDefault: input.isDefault ?? false,
      status: input.status ?? "active",
      ...(input.userId ? { userId: input.userId } : {}),
      createdAt: now,
      updatedAt: now,
    };

    if (config.isDefault) await this.clearExistingDefault();
    return this.store.insert(config);
  }

  async update(id: string, input: UpdateProviderInput): Promise<AiProviderConfig | null> {
    const existing = await this.store.getById(id);
    if (!existing) return null;

    const updated: AiProviderConfig = {
      ...existing,
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.providerType !== undefined ? { providerType: input.providerType } : {}),
      ...(input.model !== undefined ? { model: input.model } : {}),
      ...(input.apiKeyEnvVar !== undefined ? { apiKeyEnvVar: input.apiKeyEnvVar } : {}),
      ...(input.baseUrl !== undefined ? { baseUrl: input.baseUrl } : {}),
      ...(input.isDefault !== undefined ? { isDefault: input.isDefault } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      updatedAt: new Date().toISOString(),
    };

    if (input.isDefault === true) await this.clearExistingDefault(id);
    return this.store.update(id, updated);
  }

  async delete(id: string): Promise<boolean> {
    return this.store.delete(id);
  }

  async get(id: string): Promise<AiProviderConfig | null> {
    return this.store.getById(id);
  }

  async list(query: ProviderListQuery = {}): Promise<AiProviderConfig[]> {
    return this.store.list(query);
  }

  /** Resolves a config to a live `ProviderClient`. Throws `UnknownProviderTypeError` if no factory is registered for its `providerType`. */
  getClient(config: AiProviderConfig): ProviderClient {
    const factory = this.factories.get(config.providerType);
    if (!factory) throw new UnknownProviderTypeError(config.providerType);
    return factory(config);
  }

  async complete(configId: string, request: CompletionRequest): Promise<CompletionResponse> {
    const config = await this.store.getById(configId);
    if (!config) throw new Error(`AI provider config "${configId}" does not exist`);
    const client = this.getClient(config);
    this.logger.info({ configId, providerType: config.providerType, model: config.model }, "ai_provider.completion_requested");
    return client.complete(request);
  }

  /** Same as `complete()`, but resolves the default provider config instead of taking an id. Throws `NoDefaultProviderError` if none is set. */
  async completeWithDefault(request: CompletionRequest): Promise<CompletionResponse> {
    const config = await this.store.getDefault();
    if (!config) throw new NoDefaultProviderError();
    const client = this.getClient(config);
    this.logger.info(
      { configId: config.id, providerType: config.providerType, model: config.model },
      "ai_provider.completion_requested",
    );
    return client.complete(request);
  }

  private async clearExistingDefault(exceptId?: string): Promise<void> {
    const current = await this.store.getDefault();
    if (current && current.id !== exceptId) {
      await this.store.update(current.id, { ...current, isDefault: false, updatedAt: new Date().toISOString() });
    }
  }
}
