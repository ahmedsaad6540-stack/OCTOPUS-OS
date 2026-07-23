import { db } from "@workspace/db";
import { AgentManager, DrizzleAgentStore, DrizzleAgentRunStore } from "@workspace/agent-manager";
import { ProviderBackedAgentExecutor } from "@workspace/ai-provider-manager";
import { aiProviderManager } from "./ai-provider-manager.js";
import { logger } from "./logger.js";

/**
 * The one Agent Manager for this process, wired with a real
 * `AgentExecutor`: `ProviderBackedAgentExecutor` turns every invocation
 * into a call through `aiProviderManager` to whichever provider config is
 * marked default (see `/api/provider-configs`). This is the *only*
 * execution path an agent invocation takes — `AgentManager.invoke()` calls
 * this exact `AgentExecutor`, nothing else, so there is no parallel or
 * alternate way for an agent to run. If no default provider config exists
 * yet, `invoke()` still fails loudly (`NoDefaultProviderError`, surfaced by
 * the executor call throwing) rather than faking a response — same
 * "honest failure over fake success" contract as before this was wired up,
 * just one level deeper now.
 */
export const agentManager = new AgentManager(
  new DrizzleAgentStore(db),
  new DrizzleAgentRunStore(db),
  logger,
  new ProviderBackedAgentExecutor(aiProviderManager),
);
