import "dotenv/config";
import { db } from "@workspace/db";
import { campaignsTable, agentRunsTable } from "@workspace/db/schema";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Clearing all mock data from the database...");

  // 1. Delete all agent runs
  await db.delete(agentRunsTable);
  console.log("Deleted all agent runs.");

  // 2. Delete all campaigns
  await db.delete(campaignsTable);
  console.log("Deleted all campaigns.");

  console.log("✅ All mock data cleared successfully. System reset to $0.00 and 0 active campaigns.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Failed to clear mock data:", err);
  process.exit(1);
});
