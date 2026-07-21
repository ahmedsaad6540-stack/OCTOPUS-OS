import { db, campaignsTable } from "@workspace/db";

import { eq } from "drizzle-orm";

async function main() {
  const campaigns = await db.select({
    id: campaignsTable.id,
    name: campaignsTable.name,
    status: campaignsTable.status,
    publishedUrl: campaignsTable.publishedUrl
  })
  .from(campaignsTable)
  .where(eq(campaignsTable.name, "E2E Test Campaign"))
  .orderBy(campaignsTable.createdAt);

  console.log("=== DB PERSISTENCE VERIFICATION ===");
  console.log(campaigns[campaigns.length - 1]);
  process.exit(0);
}

main().catch(console.error);
