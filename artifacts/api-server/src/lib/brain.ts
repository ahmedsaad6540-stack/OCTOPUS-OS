import { db } from "@workspace/db";
import { Brain, DrizzleBrainStore, DecisionEngine, allMatchStrategy } from "@workspace/brain";
import { eventBus } from "./event-bus.js";
import { taskQueue } from "./task-queue.js";
import { logger } from "./logger.js";

/**
 * The one Decision Engine for this process. `allMatchStrategy` (every
 * matching rule acts independently) is the right default while OS Core
 * ships a single core rule per event type — swap to `priorityStrategy` or
 * `firstMatchStrategy` (both from `@workspace/brain`, re-exported from
 * `@workspace/decision-engine`) once multiple rules can legitimately
 * compete for the same event, e.g. once the Rule Engine lets non-code
 * rules register themselves at runtime.
 */
const decisionEngine = new DecisionEngine(allMatchStrategy);

/**
 * The one Brain instance for this process — OS Core's decision maker.
 * Subscribes decision rules (see `./brain-rules.ts`) and, when a rule
 * matches, acts through `taskQueue`/`eventBus` on its behalf, arbitrated by
 * `decisionEngine` whenever more than one rule matches the same event.
 * Routes only ever read from it (`GET /api/brain/decisions`); nothing calls
 * into it to make a decision directly — that only ever happens by
 * publishing an event and letting a registered rule react to it.
 */
export const brain = new Brain(new DrizzleBrainStore(db), eventBus, taskQueue, logger, decisionEngine);
