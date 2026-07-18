import "dotenv/config";
import { db } from "@workspace/db";
import { campaignsTable, agentsTable, usersTable } from "@workspace/db/schema";
import { agentManager } from "./src/lib/agent-manager.js";
import { eq, notInArray } from "drizzle-orm";

async function main() {
  console.log("Running Creator agent on new campaigns...");
  
  const users = await db.select().from(usersTable).limit(1);
  if (users.length === 0) {
    console.error("No users found.");
    process.exit(1);
  }
  const userId = users[0].id;

  // Get active campaigns that are not the first two we already ran
  const campaigns = await db.select().from(campaignsTable)
    .where(eq(campaignsTable.status, "active"));
    
  const agents = await db.select().from(agentsTable).where(eq(agentsTable.status, "active"));
  const creatorAgent = agents.find(a => a.name.toLowerCase().includes("creator"));

  if (campaigns.length === 0 || !creatorAgent) {
    console.log("No active campaigns or Creator agent found.");
    process.exit(0);
  }

  // We only run on a subset (e.g. 5 campaigns) to avoid rate limits during the batch run
  const campaignsToRun = campaigns.slice(2, 7); 

  for (const campaign of campaignsToRun) {
    console.log(`\nGenerating promotional scripts for: ${campaign.name}...`);
    try {
      const prompt = `أنت وكيل ذكاء اصطناعي متخصص في التسويق بالعمولة على منصة ${campaign.platform}.
المنتج: ${campaign.productName}
رابط الترويج: ${campaign.productUrl}

اكتب سيناريو فيديو ترويجي جذاب باللغة العربية مع هاشتاغات ملائمة لمشاركتها على ${campaign.platform}.`;
      
      const run = await agentManager.invoke(creatorAgent.id, { message: prompt }, userId);
      console.log(`✅ Completed: Run ID ${run.id}, Status: ${run.status}`);
    } catch (err) {
      console.error(`❌ Failed for ${campaign.name}:`, err);
    }
  }
  process.exit(0);
}

main().catch((err) => {
  console.error("Error running batch:", err);
  process.exit(1);
});
