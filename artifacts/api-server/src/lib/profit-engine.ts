// artifacts/api-server/src/lib/profit-engine.ts
// -------------------------------------------------
// Singleton that instantiates the ProfitEngine coordinator wired to the
// shared Drizzle db — mirrors the pattern used by brain.ts, scheduler.ts, etc.

import { db } from "@workspace/db";
import { ProfitEngine } from "@workspace/profit-engine";

export const profitEngine = new ProfitEngine(db as any);

