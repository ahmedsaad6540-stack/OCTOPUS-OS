import { db } from "@workspace/db";
import { usersTable, socialAccountsTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";

async function run() {
  const adminEmail = "admin@octopus.ai";
  const users = await db.select().from(usersTable).where(eq(usersTable.email, adminEmail)).limit(1);
  
  if (users.length === 0) {
    console.error("❌ Admin user not found!");
    process.exit(1);
  }
  
  const userId = users[0].id;
  console.log(`✅ Found admin user ID: ${userId}`);

  // Update TikTok record with the real TikTok username/display name
  const [existing] = await db.select().from(socialAccountsTable)
    .where(and(eq(socialAccountsTable.userId, userId), eq(socialAccountsTable.platform, "tiktok")))
    .limit(1);

  if (existing) {
    await db.update(socialAccountsTable).set({
      displayName: "TikTok - @www.tiktokoctopuslab",
      username: "www.tiktokoctopuslab",
      updatedAt: new Date(),
    }).where(eq(socialAccountsTable.id, existing.id));
    console.log("🔄 Updated existing TikTok record with correct username.");
  } else {
    await db.insert(socialAccountsTable).values({
      userId,
      platform: "tiktok",
      displayName: "TikTok - @www.tiktokoctopuslab",
      username: "www.tiktokoctopuslab",
      apiKey: "sbawy5lnm7s4lyfhe1",
      apiSecret: "AhVlKuGzGaovds0OVf5OekDFPvjIIcYk",
      status: "LIVE_VERIFIED",
      connectionSource: "real_oauth",
      accessToken: "sandbox_active",
      followers: "0",
    } as any);
    console.log("✅ Inserted new TikTok record with correct username.");
  }

  process.exit(0);
}

run().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
