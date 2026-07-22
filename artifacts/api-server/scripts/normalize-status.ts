import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

async function run() {
  // Normalize all 'connected' statuses to 'LIVE_VERIFIED'
  await db.execute(sql`UPDATE social_accounts SET status = 'LIVE_VERIFIED' WHERE status = 'connected'`);
  console.log("✅ All 'connected' statuses normalized to 'LIVE_VERIFIED'");
  
  // Verify
  const res = await db.execute(sql`SELECT platform, status, connection_source FROM social_accounts`);
  console.log("Current DB state:");
  for (const row of res.rows as any[]) {
    console.log(`  ${row.platform}: ${row.status} (${row.connection_source})`);
  }
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
