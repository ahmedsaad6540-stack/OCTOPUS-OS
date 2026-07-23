import { db } from "@workspace/db";
import { DrizzleTaskStore, TaskQueue } from "@workspace/task-queue";
import { eventBus } from "./event-bus.js";
import { logger } from "./logger.js";

/**
 * The one TaskQueue instance for this process — OS Core's Task Manager +
 * Queue Manager. Imported by routes and, as more OS Core modules (the
 * Brain, agents, ...) come online, by them too. It publishes every state
 * transition on `eventBus`, so any module can observe task activity without
 * calling into this module directly.
 */
export const taskQueue = new TaskQueue(new DrizzleTaskStore(db), eventBus, logger);
