import type { AgentLike, AgentLikeExecutor } from "./types.js";
import type { AiProviderManager } from "./provider-manager.js";

/**
 * The real `AgentExecutor` implementation: turns an agent's `instructions`
 * into the system prompt and the invocation's `input` into a single user
 * message, calls the configured (or default) AI provider, and returns the
 * completion. This is the *only* execution path into an LLM for an agent —
 * `AgentManager.invoke()` calls this exact interface, the same one a test
 * double satisfies in `@workspace/agent-manager`'s own tests, so there is
 * no parallel/alternate way for an agent to get run.
 *
 * `input` may be a plain string (used verbatim as the user message) or an
 * object with a `message`/`prompt`/`input` string field (extracted the
 * same way); anything else is JSON-stringified so the call never silently
 * drops what the caller sent.
 */
export class ProviderBackedAgentExecutor implements AgentLikeExecutor {
  constructor(
    private readonly providerManager: AiProviderManager,
    /** If set, always use this provider config id instead of the store's default. */
    private readonly providerConfigId?: string,
  ) {}

  async execute(agent: AgentLike, input: unknown): Promise<unknown> {
    const userMessage = toUserMessage(input);
    const request = {
      systemPrompt: agent.instructions,
      messages: [{ role: "user" as const, content: userMessage }],
    };

    const response = this.providerConfigId
      ? await this.providerManager.complete(this.providerConfigId, request)
      : await this.providerManager.completeWithDefault(request);

    return {
      content: response.content,
      model: response.model,
      stopReason: response.stopReason,
      usage: response.usage,
    };
  }
}

function toUserMessage(input: unknown): string {
  if (typeof input === "string") return input;
  if (input && typeof input === "object") {
    const record = input as Record<string, unknown>;
    for (const key of ["message", "prompt", "input"]) {
      if (typeof record[key] === "string") return record[key] as string;
    }
  }
  return JSON.stringify(input ?? null);
}
