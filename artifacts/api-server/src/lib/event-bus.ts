import { db } from "@workspace/db";
import { EventBus, DrizzleEventStore } from "@workspace/event-bus";
import { logger } from "./logger.js";

/**
 * The one EventBus instance for this process. This is imported by routes
 * and, as OS Core modules (Brain, Task Manager, Agent Manager, ...) come
 * online, by them too — it is the only channel any of them use to talk to
 * each other.
 */
export const eventBus = new EventBus(new DrizzleEventStore(db), logger);
