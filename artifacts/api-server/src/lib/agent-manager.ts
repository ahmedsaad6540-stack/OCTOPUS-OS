import { db } from "@workspace/db";
import { AgentManager, DrizzleAgentStore, DrizzleAgentRunStore } from "@workspace/agent-manager";
import { logger } from "./logger.js";

/**
 * The one Agent Manager for this process. No `AgentExecutor` is wired up
 * yet — that's the AI Provider Manager's job (next in the roadmap). Until
 * it exists, agent CRUD and run history work normally; `POST
 * /api/agents/:id/invoke` fails with a clear 501 rather than faking a
 * response (see `AgentExecutorNotConfiguredError` in `routes/agents.ts`).
 */
export const agentManager = new AgentManager(new DrizzleAgentStore(db), new DrizzleAgentRunStore(db), logger);
