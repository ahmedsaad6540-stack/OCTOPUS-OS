import "dotenv/config";
import { db } from "@workspace/db";
import { campaignsTable, usersTable, opportunitiesTable, videoJobsTable } from "@workspace/db/schema";

async function inspect() {
  console.log("=== USERS ===");
  const users = await db.select().from(usersTable);
  console.table(users.map(u => ({ id: u.id, email: u.email, name: u.name, role: u.role })));

  console.log("\n=== CAMPAIGNS ===");
  const campaigns = await db.select().from(campaignsTable);
  if (campaigns.length === 0) {
    console.log("No campaigns currently exist in campaignsTable.");
  } else {
    console.table(campaigns.map(c => ({
      id: c.id,
      name: c.name,
      productName: c.productName,
      platform: c.platform,
      status: c.status,
      revenue: c.revenue,
      clicks: c.clicks,
      conversions: c.conversions
    })));
  }

  console.log("\n=== OPPORTUNITIES ===");
  const opps = await db.select().from(opportunitiesTable);
  console.log(`Found ${opps.length} opportunities.`);

  console.log("\n=== VIDEO JOBS ===");
  const jobs = await db.select().from(videoJobsTable);
  console.log(`Found ${jobs.length} video jobs.`);
  process.exit(0);
}

inspect().catch(e => {
  console.error(e);
  process.exit(1);
});
