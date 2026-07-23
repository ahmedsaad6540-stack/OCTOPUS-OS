import { db } from "@workspace/db";
import { ToolManager, DrizzleToolStore } from "@workspace/tool-manager";
import { eventBus } from "./event-bus.js";
import { logger } from "./logger.js";

/**
 * The one Tool Manager for this process. `eventBus` satisfies
 * `@workspace/tool-manager`'s local `EventPublisher` interface
 * structurally — same decoupling as `Brain`/`TaskQueue` — so every
 * successful or failed invocation best-effort broadcasts
 * `tool.invoked`/`tool.failed` without this module importing
 * `@workspace/event-bus`. No handlers are registered here: a tool
 * definition without a registered handler is a real, reportable state
 * (`UnknownToolHandlerError`, surfaced as `501` from
 * `POST /api/tools/:name/invoke`) rather than something faked — concrete
 * tools get their handlers registered by whatever module or deployment
 * integrates them.
 */
export const toolManager = new ToolManager(new DrizzleToolStore(db), eventBus, logger);
