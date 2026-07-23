import { db } from "@workspace/db";
import { campaignsTable } from "@workspace/db/schema";
import { isNotNull, desc } from "drizzle-orm";
import { logger } from "../lib/logger.js";

async function main() {
  logger.info("Checking database for persisted TikTok URLs...");

  const rows = await db
    .select({
      id: campaignsTable.id,
      name: campaignsTable.name,
      publishedUrl: campaignsTable.publishedUrl,
      status: campaignsTable.status
    })
    .from(campaignsTable)
    .where(isNotNull(campaignsTable.publishedUrl))
    .orderBy(desc(campaignsTable.createdAt))
    .limit(10);

  if (rows.length === 0) {
    logger.warn("No campaigns found with a published URL.");
    process.exit(1);
  }

  logger.info(`Found ${rows.length} campaigns with a published URL!`);
  for (const row of rows) {
    logger.info(`- Campaign [${row.name}] (ID: ${row.id}): ${row.publishedUrl} (Status: ${row.status})`);
  }

  logger.info("✅ Database persistence verified successfully.");
  process.exit(0);
}

main().catch(err => {
  logger.error(err);
  process.exit(1);
});
