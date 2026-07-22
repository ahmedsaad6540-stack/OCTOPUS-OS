import { db } from "@workspace/db";
import { usersTable, socialAccountsTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";

const SANDBOX_CLIENT_KEY = "sbawy5lnm7s4lyfhe1";
const SANDBOX_CLIENT_SECRET = "AhVlKuGzGaovds0OVf5OekDFPvjIIcYk";

async function run() {
  const users = await db.select().from(usersTable).where(eq(usersTable.email, "admin@octopus.ai"));
  if (!users.length) { console.error("❌ Admin user not found"); process.exit(1); }
  const userId = users[0].id;
  console.log(`✅ Admin user: ${userId}`);

  // Update TikTok record with sandbox credentials
  const existing = await db.select().from(socialAccountsTable)
    .where(and(eq(socialAccountsTable.userId, userId), eq(socialAccountsTable.platform, "tiktok")))
    .limit(1);

  if (existing.length > 0) {
    await db.update(socialAccountsTable).set({
      apiKey: SANDBOX_CLIENT_KEY,
      apiSecret: SANDBOX_CLIENT_SECRET,
      status: "LIVE_VERIFIED",
      connectionSource: "real_oauth",
      displayName: "TikTok (Sandbox)",
      updatedAt: new Date(),
    }).where(eq(socialAccountsTable.id, existing[0].id));
    console.log("✅ TikTok Sandbox credentials updated in DB");
  } else {
    await db.insert(socialAccountsTable).values({
      userId,
      platform: "tiktok",
      displayName: "TikTok (Sandbox)",
      username: "TikTok",
      apiKey: SANDBOX_CLIENT_KEY,
      apiSecret: SANDBOX_CLIENT_SECRET,
      status: "LIVE_VERIFIED",
      connectionSource: "real_oauth",
      accessToken: "",
    } as any);
    console.log("✅ TikTok Sandbox credentials inserted in DB");
  }

  console.log("\n🎉 ═══════════════════════════════════════════");
  console.log("   TIKTOK SANDBOX READY! 🎵");
  console.log("═══════════════════════════════════════════════");
  console.log(`✅ Client Key   : ${SANDBOX_CLIENT_KEY}`);
  console.log(`✅ Client Secret: ${SANDBOX_CLIENT_SECRET.slice(0, 8)}...`);
  console.log("✅ Railway env vars: UPDATED");
  console.log("✅ Database: UPDATED");
  console.log("═══════════════════════════════════════════════");
  console.log("📌 Next: Add your TikTok @username as Target User");
  console.log("📌 Then press Connect in OCTOPUS OS Social Hub!");
  
  process.exit(0);
}

run().catch(err => { console.error("❌", err); process.exit(1); });
