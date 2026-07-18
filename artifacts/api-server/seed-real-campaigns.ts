import "dotenv/config";
import { db } from "@workspace/db";
import { campaignsTable, usersTable } from "@workspace/db/schema";

async function main() {
  console.log("Seeding real Digistore24 campaigns...");
  
  const users = await db.select().from(usersTable).limit(1);
  if (users.length === 0) {
    console.error("No users found.");
    process.exit(1);
  }
  const userId = users[0].id;

  // We add the 2 real products on Digistore24 using the user's affiliate token: octopuslabai4418
  const realCampaigns = [
    {
      userId,
      name: "Crypto Quantum Leap Promotion",
      productName: "Crypto Quantum Leap",
      productUrl: "https://www.digistore24.com/redir/325658/octopuslabai4418/",
      platform: "TikTok",
      affiliateNetwork: "digistore24",
      status: "active",
      budget: 150.00,
      spent: 0,
      revenue: 0,
      conversions: 0,
      clicks: 0,
    },
    {
      userId,
      name: "Tube Mastery & Monetization Promo",
      productName: "Tube Mastery and Monetization",
      productUrl: "https://www.digistore24.com/redir/299134/octopuslabai4418/",
      platform: "YouTube",
      affiliateNetwork: "digistore24",
      status: "active",
      budget: 200.00,
      spent: 0,
      revenue: 0,
      conversions: 0,
      clicks: 0,
    }
  ];

  await db.insert(campaignsTable).values(realCampaigns);
  console.log("✅ Successfully seeded 2 real Digistore24 campaigns.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Failed to seed real campaigns:", err);
  process.exit(1);
});
