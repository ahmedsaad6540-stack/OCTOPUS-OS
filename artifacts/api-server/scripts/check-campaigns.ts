import { db } from "@workspace/db";
import { campaignsTable } from "@workspace/db/schema";
import { desc } from "drizzle-orm";

async function run() {
  const campaigns = await db.select().from(campaignsTable).orderBy(desc(campaignsTable.createdAt)).limit(5);
  console.log("Recent campaigns:", JSON.stringify(campaigns, null, 2));
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
