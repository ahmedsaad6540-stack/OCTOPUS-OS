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

  // Delete any existing TikTok account links for this user
  await db.delete(socialAccountsTable).where(
    and(
      eq(socialAccountsTable.userId, userId),
      eq(socialAccountsTable.platform, "tiktok")
    )
  );
  console.log("🧹 Deleted old TikTok connection configuration");

  // Insert the new TikTok Sandbox account connected to the new email
  await db.insert(socialAccountsTable).values({
    userId,
    platform: "tiktok",
    displayName: "TikTok (octopuslabai)",
    username: "octopuslabai@gmail.com",
    apiKey: "sbawy5lnm7s4lyfhe1",
    apiSecret: "AhVlKuGzGaovds0OVf5OekDFPvjIIcYk",
    status: "LIVE_VERIFIED",
    connectionSource: "real_oauth",
    accessToken: "sandbox_active",
    followers: "0",
  } as any);

  console.log("🎉 Successfully linked new TikTok account: octopuslabai@gmail.com!");
  process.exit(0);
}

run().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
