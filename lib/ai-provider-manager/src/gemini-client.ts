import type { AiProviderConfig, CompletionRequest, CompletionResponse, ProviderClient } from "./types.js";

const DEFAULT_BASE_URL = "https://generativelanguage.googleapis.com";
const DEFAULT_MAX_TOKENS = 1024;

export type FetchLike = (url: string, init: RequestInit) => Promise<{
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
  text(): Promise<string>;
}>;

interface GeminiRequestBody {
  contents: Array<{
    role?: "user" | "model";
    parts: Array<{ text: string }>;
  }>;
  systemInstruction?: {
    parts: Array<{ text: string }>;
  };
  generationConfig?: {
    temperature?: number;
    maxOutputTokens?: number;
  };
}

export function buildGeminiRequest(
  config: AiProviderConfig,
  request: CompletionRequest,
  apiKey: string,
): { url: string; init: RequestInit } {
  const model = config.model || "gemini-1.5-pro";
  const baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
  const url = `${baseUrl}/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const body: GeminiRequestBody = {
    contents: request.messages.map((m) => ({
      role: m.role === "assistant" ? "model" as const : "user" as const,
      parts: [{ text: m.content }],
    })),
    generationConfig: {
      maxOutputTokens: request.maxTokens ?? DEFAULT_MAX_TOKENS,
    },
  };

  if (request.systemPrompt) {
    body.systemInstruction = {
      parts: [{ text: request.systemPrompt }],
    };
  }

  if (request.temperature !== undefined) {
    body.generationConfig = {
      ...body.generationConfig,
      temperature: request.temperature,
    };
  }

  return {
    url,
    init: {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    },
  };
}

interface GeminiResponseBody {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
    finishReason?: string;
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
  };
}

export function parseGeminiResponse(body: GeminiResponseBody, fallbackModel: string): CompletionResponse {
  const candidate = body.candidates?.[0];
  const text = candidate?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";

  return {
    content: text,
    model: fallbackModel,
    stopReason: candidate?.finishReason ?? null,
    usage: body.usageMetadata
      ? {
          inputTokens: body.usageMetadata.promptTokenCount ?? 0,
          outputTokens: body.usageMetadata.candidatesTokenCount ?? 0,
        }
      : null,
  };
}

export class GeminiProviderClient implements ProviderClient {
  constructor(
    private readonly config: AiProviderConfig,
    private readonly fetchFn: FetchLike = fetch,
  ) {}

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const apiKey = process.env[this.config.apiKeyEnvVar];
    if (!apiKey) {
      throw new Error(
        `Environment variable "${this.config.apiKeyEnvVar}" is not set — cannot call the Gemini API for provider config "${this.config.name}"`,
      );
    }

    const { url, init } = buildGeminiRequest(this.config, request, apiKey);
    const response = await this.fetchFn(url, init);

    if (!response.ok) {
      const bodyText = await response.text();
      throw new Error(`Gemini API request failed (${response.status}): ${bodyText}`);
    }

    const json = (await response.json()) as GeminiResponseBody;
    return parseGeminiResponse(json, this.config.model);
  }
}
