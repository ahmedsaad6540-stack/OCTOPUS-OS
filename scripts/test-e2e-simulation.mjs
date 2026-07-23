// E2E Simulation script for OCTOPUS OS
// This script simulates the full flow:
// 1. Create a Campaign
// 2. Simulate traffic (increment clicks)
// 3. Record a Sale via ProfitEngine (adds to profit_memory)
// 4. Update Campaign metrics (conversions & revenue)

const BASE = "https://api-server-production-4801.up.railway.app/api";

async function login() {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@octopus.ai", password: "octopus123" }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error("Login failed: " + JSON.stringify(data));
  console.log("🔑 Logged in as:", data.user.name);
  return { token: data.token, userId: data.user.id };
}

async function request(token, path, method = "GET", body = null) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : null,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Request to ${path} failed (${res.status}): ` + JSON.stringify(data));
  }
  return data;
}

async function main() {
  const { token, userId } = await login();

  console.log("\n🚀 Starting End-to-End Simulation...");

  // 1. Create a new campaign
  console.log("\n📁 1. Creating a new Campaign...");
  const campaignData = {
    name: "AI OS Guide Viral Campaign",
    productName: "AI OS Guide Pro",
    productUrl: "https://clickbank.com/ai-os-guide",
    platform: "tiktok",
    affiliateNetwork: "clickbank",
    status: "active",
    budget: 150.0,
    spent: 25.0,
    clicks: 0,
    conversions: 0,
    revenue: 0.0,
  };
  const { campaign } = await request(token, "/campaigns", "POST", campaignData);
  console.log(`   ✅ Campaign Created! Name: "${campaign.name}" (ID: ${campaign.id})`);

  // 2. Simulate clicks (Traffic phase)
  console.log("\n🎯 2. Simulating ad traffic (clicks)...");
  const updatedCampaignClicks = {
    clicks: 142, // ONLY send the field we want to update to avoid casting/id mutation errors
  };
  const { campaign: campaignWithClicks } = await request(
    token,
    `/campaigns/${campaign.id}`,
    "PUT",
    updatedCampaignClicks
  );
  console.log(`   ✅ Clicks registered: ${campaignWithClicks.clicks} clicks`);

  // 3. Record a Sale via ProfitEngine (Conversion phase)
  console.log("\n💰 3. Recording a sale conversion in ProfitEngine...");
  const saleData = {
    campaignId: campaign.id,
    productName: "AI OS Guide Pro",
    affiliateNetwork: "clickbank",
    trafficSource: "tiktok",
    country: "US",
    revenue: 45.0,     // $45 product revenue
    commission: 33.75, // 75% commission
    cost: 12.5,        // simulated ad cost for this conversion
    userId: userId,
  };
  
  const saleResult = await request(token, "/profit-engine/sale", "POST", saleData);
  console.log(`   ✅ Sale recorded in profit_memory! ID: ${saleResult.id ?? "OK"}`);

  // 4. Update the Campaign statistics (Revenue & conversions reflection)
  console.log("\n📈 4. Updating Campaign statistics to reflect the sale...");
  const finalCampaignStats = {
    conversions: 1,
    revenue: 33.75, // reflect our commission earned as campaign revenue
  };
  const { campaign: finalCampaign } = await request(
    token,
    `/campaigns/${campaign.id}`,
    "PUT",
    finalCampaignStats
  );
  console.log(`   ✅ Campaign stats updated! Conversions: ${finalCampaign.conversions}, Revenue: $${finalCampaign.revenue}`);

  console.log("\n🎉 E2E Simulation completed successfully!");
  console.log("\n==================================================");
  console.log("Check your CommandCenter dashboard on Vercel now. You should see:");
  console.log(`- Active Campaigns: at least 1`);
  console.log(`- Total Revenue: $${finalCampaign.revenue}`);
  console.log(`- Total Clicks: ${campaignWithClicks.clicks}`);
  console.log("==================================================");
}

main().catch((err) => {
  console.error("❌ E2E Simulation failed:", err);
});
