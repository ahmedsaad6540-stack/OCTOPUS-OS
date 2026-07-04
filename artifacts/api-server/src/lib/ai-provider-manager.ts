import { db } from "@workspace/db";
import { AiProviderManager, DrizzleProviderConfigStore } from "@workspace/ai-provider-manager";
import { logger } from "./logger.js";

/**
 * The one AI Provider Manager for this process. Ships a real
 * `ProviderClient` for Anthropic out of the box; other vendors can be
 * added later via `aiProviderManager.registerFactory(providerType, factory)`
 * without touching existing configs or callers.
 */
export const aiProviderManager = new AiProviderManager(new DrizzleProviderConfigStore(db), logger);
