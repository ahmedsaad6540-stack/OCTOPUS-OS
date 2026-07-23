import { db } from "@workspace/db";
import { AuditLogger, DrizzleAuditLogStore, ObservabilityService } from "@workspace/audit-observability";
import { eventBus } from "./event-bus.js";
import { taskQueue } from "./task-queue.js";
import { brain } from "./brain.js";
import { ruleEngine } from "./rule-engine.js";
import { agentManager } from "./agent-manager.js";
import { aiProviderManager } from "./ai-provider-manager.js";
import { toolManager } from "./tool-manager.js";
import { workflowEngine } from "./workflow-engine.js";
import { scheduler } from "./scheduler.js";
import { notificationManager } from "./notification-manager.js";
import { logger } from "./logger.js";

export const auditLogger = new AuditLogger(new DrizzleAuditLogStore(db), logger);

/**
 * The one Observability Service for this process. Every section below
 * calls straight through to a real singleton's own already-public read
 * methods — nothing here queries a database directly or duplicates any
 * module's storage. Counts are `.length` of a `.list()` page (default/
 * max limit per module), not a true `COUNT(*)` — fine as a health
 * snapshot, not exact past a module's page size; see Gotchas.
 */
export const observabilityService = new ObservabilityService(logger);

observabilityService.registerProbe({
  name: "event_bus",
  collect: async () => {
    const recent = await eventBus.history({ limit: 100 });
    return { recentEventCount: recent.length };
  },
});

observabilityService.registerProbe({
  name: "task_queue",
  collect: async () => {
    const [queued, running, failed] = await Promise.all([
      taskQueue.list({ status: "queued", limit: 500 }),
      taskQueue.list({ status: "running", limit: 500 }),
      taskQueue.list({ status: "failed", limit: 500 }),
    ]);
    return { queued: queued.length, running: running.length, failed: failed.length };
  },
});

observabilityService.registerProbe({
  name: "brain",
  collect: async () => {
    const recentDecisions = await brain.listDecisions({ limit: 100 });
    const failed = recentDecisions.filter((d) => d.outcome === "action_failed").length;
    return { recentDecisionCount: recentDecisions.length, recentFailedDecisions: failed };
  },
});

observabilityService.registerProbe({
  name: "rule_engine",
  collect: async () => {
    const rules = await ruleEngine.list({ enabled: true });
    return { activeRules: rules.length };
  },
});

observabilityService.registerProbe({
  name: "agent_manager",
  collect: async () => {
    const agents = await agentManager.list({ status: "active" });
    return { activeAgents: agents.length };
  },
});

observabilityService.registerProbe({
  name: "ai_provider_manager",
  collect: async () => {
    const providers = await aiProviderManager.list({ status: "active" });
    return { activeProviderConfigs: providers.length };
  },
});

observabilityService.registerProbe({
  name: "tool_manager",
  collect: async () => {
    const tools = await toolManager.list({ status: "active" });
    return { activeTools: tools.length };
  },
});

observabilityService.registerProbe({
  name: "workflow_engine",
  collect: async () => {
    const workflows = await workflowEngine.list({ status: "active" });
    return { activeWorkflows: workflows.length };
  },
});

observabilityService.registerProbe({
  name: "scheduler",
  collect: async () => {
    const jobs = await scheduler.list({ status: "active" });
    return { activeScheduledJobs: jobs.length };
  },
});

observabilityService.registerProbe({
  name: "notification_system",
  collect: async () => {
    const failedDeliveries = await notificationManager.listDeliveries({ status: "failed", limit: 100 });
    return { recentFailedDeliveries: failedDeliveries.length };
  },
});
