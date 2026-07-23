import { db } from "./api-server/src/db/index";
import { campaignsTable } from "./api-server/src/db/schema";
import { usersTable } from "./api-server/src/db/schema";
import { eq } from "drizzle-orm";

async function run() {
  try {
    const adminEmail = "admin@octopus.ai";
    const userResult = await db.select().from(usersTable).where(eq(usersTable.email, adminEmail));
    if (userResult.length === 0) {
      console.log("Admin not found");
      return;
    }
    const adminUser = userResult[0];
    const campaigns = await db.select().from(campaignsTable).where(eq(campaignsTable.userId, adminUser.id));
    console.log(JSON.stringify(campaigns, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
run();
