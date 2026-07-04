import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { AnthropicProviderClient, buildAnthropicRequest, parseAnthropicResponse } from "./anthropic-client.js";
import type { AiProviderConfig, CompletionRequest } from "./types.js";
import type { FetchLike } from "./anthropic-client.js";

function makeConfig(overrides: Partial<AiProviderConfig> = {}): AiProviderConfig {
  return {
    id: "cfg-1",
    name: "default anthropic",
    providerType: "anthropic",
    model: "claude-sonnet-5",
    apiKeyEnvVar: "TEST_ANTHROPIC_KEY",
    isDefault: true,
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("buildAnthropicRequest", () => {
  test("builds the URL, headers, and body Anthropic's Messages API expects", () => {
    const config = makeConfig();
    const request: CompletionRequest = {
      systemPrompt: "You are helpful.",
      messages: [{ role: "user", content: "Hello" }],
      maxTokens: 512,
      temperature: 0.5,
    };
    const { url, init } = buildAnthropicRequest(config, request, "sk-test-key");

    assert.equal(url, "https://api.anthropic.com/v1/messages");
    assert.equal((init.headers as Record<string, string>)["x-api-key"], "sk-test-key");
    assert.equal((init.headers as Record<string, string>)["anthropic-version"], "2023-06-01");
    assert.equal((init.headers as Record<string, string>)["content-type"], "application/json");

    const body = JSON.parse(init.body as string);
    assert.equal(body.model, "claude-sonnet-5");
    assert.equal(body.max_tokens, 512);
    assert.equal(body.temperature, 0.5);
    assert.equal(body.system, "You are helpful.");
    assert.deepEqual(body.messages, [{ role: "user", content: "Hello" }]);
  });

  test("defaults max_tokens and omits system/temperature when not provided", () => {
    const config = makeConfig();
    const { init } = buildAnthropicRequest(config, { messages: [{ role: "user", content: "hi" }] }, "key");
    const body = JSON.parse(init.body as string);
    assert.equal(body.max_tokens, 1024);
    assert.equal("system" in body, false);
    assert.equal("temperature" in body, false);
  });

  test("respects a config baseUrl override", () => {
    const config = makeConfig({ baseUrl: "https://proxy.internal" });
    const { url } = buildAnthropicRequest(config, { messages: [{ role: "user", content: "hi" }] }, "key");
    assert.equal(url, "https://proxy.internal/v1/messages");
  });
});

describe("parseAnthropicResponse", () => {
  test("joins text blocks and maps usage fields", () => {
    const parsed = parseAnthropicResponse({
      content: [
        { type: "text", text: "Hello " },
        { type: "text", text: "world" },
      ],
      model: "claude-sonnet-5",
      stop_reason: "end_turn",
      usage: { input_tokens: 10, output_tokens: 5 },
    });
    assert.equal(parsed.content, "Hello world");
    assert.equal(parsed.model, "claude-sonnet-5");
    assert.equal(parsed.stopReason, "end_turn");
    assert.deepEqual(parsed.usage, { inputTokens: 10, outputTokens: 5 });
  });

  test("handles a missing usage field", () => {
    const parsed = parseAnthropicResponse({ content: [{ type: "text", text: "hi" }], model: "m", stop_reason: null });
    assert.equal(parsed.usage, null);
  });

  test("ignores non-text content blocks", () => {
    const parsed = parseAnthropicResponse({
      content: [
        { type: "tool_use" },
        { type: "text", text: "kept" },
      ],
      model: "m",
      stop_reason: "end_turn",
    });
    assert.equal(parsed.content, "kept");
  });
});

describe("AnthropicProviderClient", () => {
  test("throws a clear error when the configured env var is unset", async () => {
    const config = makeConfig({ apiKeyEnvVar: "DEFINITELY_NOT_SET_ENV_VAR" });
    const client = new AnthropicProviderClient(config, (async () => {
      throw new Error("fetch should not be called");
    }) as FetchLike);
    await assert.rejects(
      () => client.complete({ messages: [{ role: "user", content: "hi" }] }),
      /DEFINITELY_NOT_SET_ENV_VAR.*is not set/,
    );
  });

  test("performs the call via the injected fetch and parses the response", async () => {
    process.env["TEST_ANTHROPIC_KEY_UNIT"] = "sk-unit-test";
    const config = makeConfig({ apiKeyEnvVar: "TEST_ANTHROPIC_KEY_UNIT" });

    let capturedUrl = "";
    let capturedInit: RequestInit | undefined;
    const fakeFetch: FetchLike = async (url, init) => {
      capturedUrl = url;
      capturedInit = init;
      return {
        ok: true,
        status: 200,
        async json() {
          return {
            content: [{ type: "text", text: "hi there" }],
            model: "claude-sonnet-5",
            stop_reason: "end_turn",
            usage: { input_tokens: 3, output_tokens: 2 },
          };
        },
        async text() {
          return "";
        },
      };
    };

    const client = new AnthropicProviderClient(config, fakeFetch);
    const result = await client.complete({ messages: [{ role: "user", content: "hi" }] });

    assert.equal(capturedUrl, "https://api.anthropic.com/v1/messages");
    assert.equal((capturedInit!.headers as Record<string, string>)["x-api-key"], "sk-unit-test");
    assert.equal(result.content, "hi there");
    assert.deepEqual(result.usage, { inputTokens: 3, outputTokens: 2 });

    delete process.env["TEST_ANTHROPIC_KEY_UNIT"];
  });

  test("throws with the response body when the API call fails", async () => {
    process.env["TEST_ANTHROPIC_KEY_FAIL"] = "sk-unit-test";
    const config = makeConfig({ apiKeyEnvVar: "TEST_ANTHROPIC_KEY_FAIL" });
    const fakeFetch: FetchLike = async () => ({
      ok: false,
      status: 401,
      async json() {
        return {};
      },
      async text() {
        return '{"error":"invalid api key"}';
      },
    });

    const client = new AnthropicProviderClient(config, fakeFetch);
    await assert.rejects(
      () => client.complete({ messages: [{ role: "user", content: "hi" }] }),
      /Anthropic API request failed \(401\)/,
    );

    delete process.env["TEST_ANTHROPIC_KEY_FAIL"];
  });
});
