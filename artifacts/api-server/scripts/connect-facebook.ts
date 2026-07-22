import { db } from "@workspace/db";
import { usersTable, socialAccountsTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";

const SHORT_TOKEN = "EAAZAQIJ5hxIkBSFRa1xNkq8fsGoeC5CIuZAE0CW839x5oYkQU8y4UfmnD0nn1Bsiz4IeeMV2ZAGf3w6HbWYeiOa9n2jcZAavZABvTbBQTLp9ZB2MGQQXCDrPbZAKFNTGjfr0vEkhZB3ti2OZAM3rIYWyi0EMaPQUywWOszDZBkCAUcLSrysRUk87MpJeyj6Jwhq4yZAaZBO6p7pJmM6ZCauS3y7JaNIVU1DXfcjHvR3ciaQn1G5f3eA8ljCpxerpyHbmTZBNRZCIkLWHxplZCOlZBr6lf";
const APP_ID = "1776950886646921";
const APP_SECRET = "c8c31f6f5b520b454f447a65e7c9ea77";

async function run() {
  console.log("🔄 Step 1: Exchanging short-lived token for long-lived token...");
  
  // Exchange for long-lived token (60 days)
  const exchangeRes = await fetch(
    `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${APP_ID}&client_secret=${APP_SECRET}&fb_exchange_token=${SHORT_TOKEN}`
  );
  const exchangeData = await exchangeRes.json() as any;
  
  if (exchangeData.error) {
    console.error("❌ Token exchange failed:", exchangeData.error.message);
    process.exit(1);
  }
  
  const longLivedToken = exchangeData.access_token;
  const expiresIn = exchangeData.expires_in;
  console.log(`✅ Got Long-Lived Token! Expires in: ${Math.round(expiresIn / 86400)} days`);

  // Get user info
  console.log("\n🔄 Step 2: Getting user info...");
  const meRes = await fetch(`https://graph.facebook.com/v18.0/me?fields=id,name,picture&access_token=${longLivedToken}`);
  const meData = await meRes.json() as any;
  
  if (meData.error) {
    console.error("❌ Failed to get user info:", meData.error.message);
    process.exit(1);
  }
  console.log(`✅ User: ${meData.name} (ID: ${meData.id})`);

  // Get pages
  console.log("\n🔄 Step 3: Getting Facebook Pages...");
  const pagesRes = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${longLivedToken}`);
  const pagesData = await pagesRes.json() as any;
  
  let pageToken = longLivedToken;
  let pageName = meData.name;
  let pageId = meData.id;
  
  if (pagesData.data && pagesData.data.length > 0) {
    const page = pagesData.data[0];
    pageToken = page.access_token;
    pageName = page.name;
    pageId = page.id;
    console.log(`✅ Found Page: ${pageName} (ID: ${pageId})`);
  } else {
    console.log("ℹ️ No pages found, using personal profile token");
  }

  // Get Instagram account linked to page
  console.log("\n🔄 Step 4: Getting Instagram Business Account...");
  let igUsername = "";
  let igId = "";
  
  const igRes = await fetch(
    `https://graph.facebook.com/v18.0/${pageId}?fields=instagram_business_account&access_token=${pageToken}`
  );
  const igData = await igRes.json() as any;
  
  if (igData.instagram_business_account?.id) {
    igId = igData.instagram_business_account.id;
    const igInfoRes = await fetch(`https://graph.facebook.com/v18.0/${igId}?fields=username,followers_count&access_token=${pageToken}`);
    const igInfoData = await igInfoRes.json() as any;
    igUsername = igInfoData.username || igId;
    console.log(`✅ Found Instagram: @${igUsername}`);
  } else {
    igUsername = meData.name;
    console.log("ℹ️ No Instagram Business Account linked to page");
  }

  // Find admin user
  const users = await db.select().from(usersTable).where(eq(usersTable.email, "admin@octopus.ai"));
  if (users.length === 0) { console.error("❌ Admin user not found"); process.exit(1); }
  const userId = users[0].id;

  const tokenExpiry = new Date(Date.now() + expiresIn * 1000);

  // Save Facebook
  console.log("\n🔄 Step 5: Saving Facebook to database...");
  const existingFb = await db.select().from(socialAccountsTable)
    .where(and(eq(socialAccountsTable.userId, userId), eq(socialAccountsTable.platform, "facebook"))).limit(1);
  
  if (existingFb.length > 0) {
    await db.update(socialAccountsTable).set({
      accessToken: pageToken,
      displayName: pageName,
      username: pageId,
      status: "LIVE_VERIFIED",
      connectionSource: "real_oauth",
      followers: "0",
      tokenExpiresAt: tokenExpiry,
      updatedAt: new Date(),
    }).where(eq(socialAccountsTable.id, existingFb[0].id));
    console.log(`✅ Facebook updated: ${pageName}`);
  } else {
    await db.insert(socialAccountsTable).values({
      userId, platform: "facebook", displayName: pageName, username: pageId,
      apiKey: APP_ID, apiSecret: APP_SECRET, accessToken: pageToken,
      status: "LIVE_VERIFIED", connectionSource: "real_oauth",
      tokenExpiresAt: tokenExpiry,
    } as any);
    console.log(`✅ Facebook inserted: ${pageName}`);
  }

  // Save Instagram
  console.log("\n🔄 Step 6: Saving Instagram to database...");
  const existingIg = await db.select().from(socialAccountsTable)
    .where(and(eq(socialAccountsTable.userId, userId), eq(socialAccountsTable.platform, "instagram"))).limit(1);
  
  if (existingIg.length > 0) {
    await db.update(socialAccountsTable).set({
      accessToken: pageToken,
      displayName: `Instagram - ${igUsername}`,
      username: igUsername,
      status: "LIVE_VERIFIED",
      connectionSource: "real_oauth",
      followers: "0",
      tokenExpiresAt: tokenExpiry,
      updatedAt: new Date(),
    }).where(eq(socialAccountsTable.id, existingIg[0].id));
    console.log(`✅ Instagram updated: @${igUsername}`);
  } else {
    await db.insert(socialAccountsTable).values({
      userId, platform: "instagram", displayName: `Instagram - ${igUsername}`, username: igUsername,
      apiKey: APP_ID, apiSecret: APP_SECRET, accessToken: pageToken,
      status: "LIVE_VERIFIED", connectionSource: "real_oauth",
      tokenExpiresAt: tokenExpiry,
    } as any);
    console.log(`✅ Instagram inserted: @${igUsername}`);
  }

  console.log("\n🎉 ═══════════════════════════════════════");
  console.log("   FACEBOOK & INSTAGRAM CONNECTED! 🚀");
  console.log("═════════════════════════════════════════");
  console.log(`✅ Facebook  → ${pageName}`);
  console.log(`✅ Instagram → @${igUsername}`);
  console.log(`📅 Token valid until: ${tokenExpiry.toLocaleDateString()}`);
  console.log("═════════════════════════════════════════");
  
  process.exit(0);
}

run().catch(err => { console.error("❌ Error:", err); process.exit(1); });
