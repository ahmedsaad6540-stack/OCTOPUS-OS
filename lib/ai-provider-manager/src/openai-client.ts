import type { AiProviderConfig, CompletionRequest, CompletionResponse, ProviderClient } from "./types.js";

const DEFAULT_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_MAX_TOKENS = 1024;

export type FetchLike = (url: string, init: RequestInit) => Promise<{
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
  text(): Promise<string>;
}>;

interface OpenAiRequestBody {
  model: string;
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  max_tokens?: number;
  temperature?: number;
  response_format?: { type: "text" | "json_object" };
}

export function buildOpenAiRequest(
  config: AiProviderConfig,
  request: CompletionRequest,
  apiKey: string,
): { url: string; init: RequestInit } {
  const baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
  const url = `${baseUrl}/chat/completions`;

  const messages: OpenAiRequestBody["messages"] = [];
  if (request.systemPrompt) {
    messages.push({ role: "system", content: request.systemPrompt });
  }
  request.messages.forEach((m) => {
    messages.push({ role: m.role, content: m.content });
  });

  const body: OpenAiRequestBody = {
    model: config.model,
    messages,
    max_tokens: request.maxTokens ?? DEFAULT_MAX_TOKENS,
  };

  if (request.temperature !== undefined) {
    body.temperature = request.temperature;
  }
  if (request.jsonSchema) {
    body.response_format = {
      type: "json_schema",
      json_schema: {
        name: "structured_output",
        schema: request.jsonSchema,
        strict: true
      }
    } as any;
  } else if (request.responseFormat) {
    body.response_format = { type: request.responseFormat };
  }

  return {
    url,
    init: {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    },
  };
}

interface OpenAiResponseBody {
  choices?: Array<{
    message?: {
      content?: string;
    };
    finish_reason?: string;
  }>;
  model?: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
  };
}

export function parseOpenAiResponse(body: OpenAiResponseBody): CompletionResponse {
  const choice = body.choices?.[0];
  const text = choice?.message?.content ?? "";

  return {
    content: text,
    model: body.model ?? "",
    stopReason: choice?.finish_reason ?? null,
    usage: body.usage
      ? {
          inputTokens: body.usage.prompt_tokens ?? 0,
          outputTokens: body.usage.completion_tokens ?? 0,
        }
      : null,
  };
}

import type { ImageGenerationRequest, ImageGenerationResponse } from "./types.js";

export class OpenAiProviderClient implements ProviderClient {
  constructor(
    private readonly config: AiProviderConfig,
    private readonly fetchFn: FetchLike = fetch,
  ) {}

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const apiKey = process.env[this.config.apiKeyEnvVar];
    if (!apiKey) {
      throw new Error(
        `Environment variable "${this.config.apiKeyEnvVar}" is not set — cannot call the OpenAI API for provider config "${this.config.name}"`,
      );
    }

    const { url, init } = buildOpenAiRequest(this.config, request, apiKey);
    
    const controller = new AbortController();
    if (request.timeoutMs) {
      setTimeout(() => controller.abort(), request.timeoutMs);
    }
    init.signal = controller.signal;

    try {
      const response = await this.fetchFn(url, init);

      if (!response.ok) {
        const bodyText = await response.text();
        throw new Error(`OpenAI API request failed (${response.status}): ${bodyText}`);
      }

      const json = (await response.json()) as OpenAiResponseBody;
      return parseOpenAiResponse(json);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error(`OpenAI API request timed out after ${request.timeoutMs}ms`);
      }
      throw err;
    }
  }

  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    const apiKey = process.env[this.config.apiKeyEnvVar];
    if (!apiKey) {
      throw new Error(`Environment variable "${this.config.apiKeyEnvVar}" is not set.`);
    }

    const baseUrl = this.config.baseUrl ?? DEFAULT_BASE_URL;
    const url = `${baseUrl}/images/generations`;

    const body = {
      model: "dall-e-3", // Default image model for OpenAI
      prompt: request.prompt,
      n: request.n ?? 1,
      size: request.size ?? "1024x1024",
      quality: request.quality ?? "standard"
    };

    const response = await this.fetchFn(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const bodyText = await response.text();
      throw new Error(`OpenAI API Image request failed (${response.status}): ${bodyText}`);
    }

    return (await response.json()) as ImageGenerationResponse;
  }
}
