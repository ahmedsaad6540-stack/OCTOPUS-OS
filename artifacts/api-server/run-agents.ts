import "dotenv/config";
import { db } from "@workspace/db";
import { campaignsTable, agentsTable, usersTable } from "@workspace/db/schema";
import { agentManager } from "./src/lib/agent-manager.js";
import { eq } from "drizzle-orm";

async function main() {
  console.log("Running agents against campaigns...");
  
  const users = await db.select().from(usersTable).limit(1);
  if (users.length === 0) {
    console.error("No users found.");
    process.exit(1);
  }
  const userId = users[0].id;

  const campaigns = await db.select().from(campaignsTable).where(eq(campaignsTable.status, "active"));
  const agents = await db.select().from(agentsTable).where(eq(agentsTable.status, "active"));

  if (campaigns.length === 0 || agents.length === 0) {
    console.log("No active campaigns or agents.");
    process.exit(0);
  }

  // To prevent hitting AI provider rate limits, run on 3 campaigns
  const targetCampaigns = campaigns.slice(0, 3);
  const targetAgents = agents.filter(a => a.name.toLowerCase().includes("creator") || a.name.toLowerCase().includes("trend"));

  for (const campaign of targetCampaigns) {
    console.log(`\n==========================================`);
    console.log(`Campaign: ${campaign.name} (${campaign.productName})`);
    console.log(`==========================================`);
    for (const agent of targetAgents) {
      console.log(`Invoking agent: ${agent.name}...`);
      try {
        const prompt = `أنت وكيل ذكاء اصطناعي متخصص في التسويق بالعمولة.
نعمل حالياً على الترويج للمنتج التالي:
- اسم المنتج: ${campaign.productName}
- المنصة: ${campaign.platform}
- رابط الأفلييت: ${campaign.productUrl}

المطلوب منك: اكتب 3 أفكار فيديو تسويقية جذابة لترويج هذا المنتج على منصة ${campaign.platform}.`;
        
        const run = await agentManager.invoke(agent.id, { message: prompt }, userId);
        console.log(`✅ Agent ${agent.name} completed. Run ID: ${run.id}, Status: ${run.status}`);
      } catch (err) {
        console.error(`❌ Agent ${agent.name} failed:`, err);
      }
    }
  }
  process.exit(0);
}

main().catch((err) => {
  console.error("Failed to run agents:", err);
  process.exit(1);
});
