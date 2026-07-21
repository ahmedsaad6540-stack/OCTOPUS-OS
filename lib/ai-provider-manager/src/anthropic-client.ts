import type { AiProviderConfig, CompletionRequest, CompletionResponse, ProviderClient } from "./types.js";

const DEFAULT_BASE_URL = "https://api.anthropic.com";
const ANTHROPIC_VERSION = "2023-06-01";
const DEFAULT_MAX_TOKENS = 1024;

export type FetchLike = (url: string, init: RequestInit) => Promise<{
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
  text(): Promise<string>;
}>;

interface AnthropicRequestBody {
  model: string;
  max_tokens: number;
  messages: { role: "user" | "assistant"; content: string }[];
  system?: string;
  temperature?: number;
  tools?: any[];
  tool_choice?: any;
}

/**
 * Builds the exact request Anthropic's Messages API expects. Pure and
 * side-effect-free so it's fully unit-testable without a network call —
 * the one place that isn't pure is `AnthropicProviderClient.complete()`
 * itself, which just performs the fetch this function describes.
 */
export function buildAnthropicRequest(
  config: AiProviderConfig,
  request: CompletionRequest,
  apiKey: string,
): { url: string; init: RequestInit } {
  const body: AnthropicRequestBody = {
    model: config.model,
    max_tokens: request.maxTokens ?? DEFAULT_MAX_TOKENS,
    messages: request.messages.map((m) => ({ role: m.role, content: m.content })),
  };
  if (request.systemPrompt !== undefined) body.system = request.systemPrompt;
  if (request.temperature !== undefined) body.temperature = request.temperature;

  if (request.jsonSchema) {
    body.tools = [{
      name: "structured_output",
      description: "Format the output according to the provided schema",
      input_schema: request.jsonSchema
    }];
    body.tool_choice = { type: "tool", name: "structured_output" };
  }

  return {
    url: `${config.baseUrl ?? DEFAULT_BASE_URL}/v1/messages`,
    init: {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
      },
      body: JSON.stringify(body),
    },
  };
}

interface AnthropicResponseBody {
  content: { type: string; text?: string; input?: any }[];
  model: string;
  stop_reason: string | null;
  usage?: { input_tokens: number; output_tokens: number };
}

/** Parses an Anthropic Messages API response into the provider-agnostic `CompletionResponse` shape. Pure — no I/O. */
export function parseAnthropicResponse(body: AnthropicResponseBody): CompletionResponse {
  // Check if there is a tool use block
  const toolBlock = body.content.find((block) => block.type === "tool_use" && block.input);
  const textBlock = body.content.find((block) => block.type === "text" && typeof block.text === "string");

  const text = toolBlock ? JSON.stringify(toolBlock.input) : (textBlock?.text ?? "");

  return {
    content: text,
    model: body.model,
    stopReason: body.stop_reason,
    usage: body.usage ? { inputTokens: body.usage.input_tokens, outputTokens: body.usage.output_tokens } : null,
  };
}

/**
 * Real `ProviderClient` for Anthropic's Messages API. `fetch` is injected
 * (defaulting to the runtime global) purely so request-building/response-
 * parsing can be exercised in tests without a live network call — the HTTP
 * call itself is genuine, not simulated.
 */
export class AnthropicProviderClient implements ProviderClient {
  constructor(
    private readonly config: AiProviderConfig,
    private readonly fetchFn: FetchLike = fetch,
  ) {}

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const apiKey = process.env[this.config.apiKeyEnvVar];
    if (!apiKey) {
      throw new Error(
        `Environment variable "${this.config.apiKeyEnvVar}" is not set — cannot call the Anthropic API for provider config "${this.config.name}"`,
      );
    }

    const { url, init } = buildAnthropicRequest(this.config, request, apiKey);
    
    const controller = new AbortController();
    if (request.timeoutMs) {
      setTimeout(() => controller.abort(), request.timeoutMs);
    }
    init.signal = controller.signal;

    try {
      const response = await this.fetchFn(url, init);

      if (!response.ok) {
        const bodyText = await response.text();
        throw new Error(`Anthropic API request failed (${response.status}): ${bodyText}`);
      }

      const json = (await response.json()) as AnthropicResponseBody;
      return parseAnthropicResponse(json);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error(`Anthropic API request timed out after ${request.timeoutMs}ms`);
      }
      throw err;
    }
  }
}
