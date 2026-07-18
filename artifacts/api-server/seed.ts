import { db } from "@workspace/db";
import { usersTable, campaignsTable } from "@workspace/db/schema";

async function main() {
  console.log("Seeding campaigns...");
  
  const users = await db.select().from(usersTable).limit(1);
  if (users.length === 0) {
    console.error("No users found in database. Cannot seed campaigns.");
    process.exit(1);
  }
  const userId = users[0].id;

  const sampleProducts = [
    { name: "AI Influencer System", url: "https://aifluencersystem.de/start#aff=octopuslabai4418", network: "digistore24", platform: "TikTok" },
    { name: "Tube Mastery and Monetization", url: "https://tubemastery.com#aff=test", network: "digistore24", platform: "YouTube" },
    { name: "Perpetual Income 365", url: "https://perpetualincome.com#aff=test", network: "clickbank", platform: "Instagram" },
    { name: "Secret Email System", url: "https://secretemail.com#aff=test", network: "clickbank", platform: "Facebook" },
    { name: "Crypto Quantum Leap", url: "https://cryptoquantum.com#aff=test", network: "digistore24", platform: "TikTok" },
    { name: "Custom Keto Diet", url: "https://customketo.com#aff=test", network: "clickbank", platform: "Instagram" },
    { name: "Okinawa Flat Belly Tonic", url: "https://okinawa.com#aff=test", network: "clickbank", platform: "TikTok" },
    { name: "Midas Manifestation", url: "https://midas.com#aff=test", network: "digistore24", platform: "YouTube" },
    { name: "Genius Script", url: "https://geniusscript.com#aff=test", network: "clickbank", platform: "Instagram" },
    { name: "Brain Training for Dogs", url: "https://braintraining.com#aff=test", network: "clickbank", platform: "TikTok" },
  ];

  const campaigns = [];
  for (let i = 0; i < 20; i++) {
    const p = sampleProducts[i % sampleProducts.length];
    campaigns.push({
      userId,
      name: `${p.name} Campaign ${Math.floor(i / sampleProducts.length) + 1}`,
      productName: p.name,
      productUrl: p.url,
      platform: p.platform,
      affiliateNetwork: p.network,
      status: "active",
      budget: 100 + Math.random() * 400,
      revenue: Math.random() > 0.5 ? Math.random() * 50 : 0,
      conversions: Math.floor(Math.random() * 3),
      clicks: Math.floor(Math.random() * 500),
    });
  }

  await db.insert(campaignsTable).values(campaigns);
  
  console.log("✅ Successfully seeded 20 active campaigns.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Failed to seed:", err);
  process.exit(1);
});
