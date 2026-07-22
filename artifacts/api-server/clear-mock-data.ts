import "dotenv/config";
import { db } from "@workspace/db";
import { campaignsTable, agentRunsTable } from "@workspace/db/schema";
import { sql } from "drizzle-orm";

async function main() {
  console.log("SAFETY LOCK ACTIVE: Destructive script disabled.");
  console.log("To clear mock data, you must provide explicit workspace ID and run in dry-run mode.");
  process.exit(1);
}

main().catch((err) => {
  console.error("Failed to clear mock data:", err);
  process.exit(1);
});
