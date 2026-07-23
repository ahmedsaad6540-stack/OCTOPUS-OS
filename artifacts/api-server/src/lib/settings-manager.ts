import { db } from "@workspace/db";
import { SettingsManager, DrizzleSettingsStore } from "@workspace/settings";
import { logger } from "./logger.js";

/** The one Settings Manager for this process — generic key-value settings at "system" and "user" scope. */
export const settingsManager = new SettingsManager(new DrizzleSettingsStore(db), logger);
