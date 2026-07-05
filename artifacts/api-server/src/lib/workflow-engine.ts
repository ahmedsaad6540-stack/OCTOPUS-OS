import { db } from "@workspace/db";
import { WorkflowEngine, DrizzleWorkflowStore, DrizzleWorkflowRunStore } from "@workspace/workflow-engine";
import { taskQueue } from "./task-queue.js";
import { eventBus } from "./event-bus.js";
import { agentManager } from "./agent-manager.js";
import { toolManager } from "./tool-manager.js";
import { logger } from "./logger.js";

/**
 * The one Workflow Engine for this process. Every step type delegates to
 * the real singleton that already owns that capability — `taskQueue`,
 * `eventBus`, `agentManager`, `toolManager` — through the decoupled
 * interfaces `@workspace/workflow-engine` declares for itself. No step
 * type reimplements what any of those modules do.
 */
export const workflowEngine = new WorkflowEngine(
  new DrizzleWorkflowStore(db),
  new DrizzleWorkflowRunStore(db),
  {
    taskEnqueuer: taskQueue,
    eventPublisher: eventBus,
    agentInvoker: agentManager,
    toolInvoker: toolManager,
  },
  logger,
);
