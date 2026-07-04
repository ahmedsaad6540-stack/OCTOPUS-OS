import { db } from "@workspace/db";
import { RuleEngine, DrizzleRuleDefinitionStore } from "@workspace/rule-engine";
import { brain } from "./brain.js";
import { logger } from "./logger.js";

/**
 * The one Rule Engine instance for this process. Turns data-defined rules
 * (created/updated/enabled/disabled/deleted through `/api/rules`) into
 * `DecisionRule`s and keeps `brain`'s registered rules in sync as they
 * change — no restart required. `brain` structurally satisfies
 * `RuleRegistrar`; the Rule Engine never imports `@workspace/brain`.
 */
export const ruleEngine = new RuleEngine(new DrizzleRuleDefinitionStore(db), brain, logger);
