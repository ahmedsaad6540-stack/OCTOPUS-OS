import "dotenv/config";
import { db } from "@workspace/db";
import { campaignsTable, usersTable } from "@workspace/db/schema";

async function main() {
  console.log("Seeding 10 popular real Digistore24 campaigns...");
  
  const users = await db.select().from(usersTable).limit(1);
  if (users.length === 0) {
    console.error("No users found.");
    process.exit(1);
  }
  const userId = users[0].id;

  const realProducts = [
    { name: "The Ultimate Keto Meal Plan", id: "451859", niche: "Health & Fitness", platform: "TikTok" },
    { name: "Keto Desserts Cookbook", id: "280992", niche: "Health & Fitness", platform: "Instagram" },
    { name: "Smart Blood Sugar Program", id: "307885", niche: "Health & Fitness", platform: "YouTube" },
    { name: "His Secret Obsession", id: "302188", niche: "Relationships", platform: "TikTok" },
    { name: "The Home Doctor Book", id: "446724", niche: "Survival & Health", platform: "Facebook" },
    { name: "Erase My Back Pain", id: "315682", niche: "Health & Fitness", platform: "YouTube" },
    { name: "Steel Bite Pro Dental", id: "348582", niche: "Dental Health", platform: "TikTok" },
    { name: "Metabolic Stretching Fitness", id: "351859", niche: "Health & Fitness", platform: "Instagram" },
    { name: "Ted's Woodworking Plans", id: "299234", niche: "Home & Garden", platform: "Pinterest" },
    { name: "15 Minute Manifestation", id: "309194", niche: "Self-Help", platform: "TikTok" }
  ];

  const newCampaigns = realProducts.map(p => ({
    userId,
    name: `${p.name} Promotion`,
    productName: p.name,
    productUrl: `https://www.digistore24.com/redir/${p.id}/octopuslabai4418/`,
    platform: p.platform,
    affiliateNetwork: "digistore24",
    status: "active",
    budget: 100.00 + Math.random() * 200,
    spent: 0,
    revenue: 0,
    conversions: 0,
    clicks: 0,
    notes: `Niche: ${p.niche}. Real Digistore24 Product ID: ${p.id}`
  }));

  await db.insert(campaignsTable).values(newCampaigns);
  console.log("✅ Successfully seeded 10 real Digistore24 campaigns.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Failed to seed real campaigns:", err);
  process.exit(1);
});
