import "dotenv/config";
import { db } from "@workspace/db";
import { campaignsTable, agentsTable, usersTable } from "@workspace/db/schema";
import { agentManager } from "./src/lib/agent-manager.js";
import { eq } from "drizzle-orm";

async function main() {
  console.log("Running agents against real Digistore24 campaigns...");
  
  const users = await db.select().from(usersTable).limit(1);
  if (users.length === 0) {
    console.error("No users found.");
    process.exit(1);
  }
  const userId = users[0].id;

  const campaigns = await db.select().from(campaignsTable).where(eq(campaignsTable.status, "active"));
  const agents = await db.select().from(agentsTable).where(eq(agentsTable.status, "active"));

  if (campaigns.length === 0 || agents.length === 0) {
    console.log("No active campaigns or agents found.");
    process.exit(0);
  }

  const targetAgents = agents.filter(a => a.name.toLowerCase().includes("creator") || a.name.toLowerCase().includes("trend"));

  for (const campaign of campaigns) {
    console.log(`\n==========================================`);
    console.log(`Campaign: ${campaign.name} (${campaign.productName})`);
    console.log(`URL: ${campaign.productUrl}`);
    console.log(`==========================================`);
    for (const agent of targetAgents) {
      console.log(`Invoking agent: ${agent.name}...`);
      try {
        const prompt = `أنت وكيل ذكاء اصطناعي متخصص في التسويق بالعمولة على منصة ${campaign.platform}.
نعمل حالياً على الترويج للمنتج التالي:
- اسم المنتج: ${campaign.productName}
- المنصة المستهدفة للنشر: ${campaign.platform}
- رابط الأفلييت الحقيقي الخاص بنا: ${campaign.productUrl}

المطلوب منك:
1. اكتب 3 سيناريوهات فيديو قصيرة (Short-form/TikTok/YouTube Shorts) فيروسية وجذابة جداً ومكتوبة بالعربية لترويج هذا المنتج خصيصاً باستخدام رابط الأفلييت الخاص بنا.
2. لكل فيديو، حدد الخطاف (Hook) والنص والتوجيه للفعل (CTA) والهاشتاغات الرائجة.`;
        
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
