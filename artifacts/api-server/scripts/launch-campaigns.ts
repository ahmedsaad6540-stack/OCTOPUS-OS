import { db } from "@workspace/db";
import { campaignsTable } from "@workspace/db/schema";
import { campaignWorkflowService } from "../src/lib/campaign-workflow-service.js";

async function run() {
  const userId = "c0cf7cfd-38c4-4ef4-aaa5-64773407063c"; // Admin user

  const campaigns = [
    {
      name: "Water Revolution Promo",
      productName: "Water Revolution",
      productUrl: "https://uswaterrevolution.com/#aff=octopuslabai4418",
      platform: "facebook",
      affiliateNetwork: "custom",
    },
    {
      name: "Digistore24 AI System",
      productName: "Digistore24 Promo 660957",
      productUrl: "https://www.digistore24.com/redir/660957/octopuslabai4418/",
      platform: "youtube",
      affiliateNetwork: "digistore24",
    }
  ];

  for (const c of campaigns) {
    console.log(`Creating campaign: ${c.name}...`);
    const [inserted] = await db.insert(campaignsTable).values({
      userId,
      name: c.name,
      productName: c.productName,
      productUrl: c.productUrl,
      platform: c.platform,
      affiliateNetwork: c.affiliateNetwork,
      status: "draft",
    } as any).returning();
    
    console.log(`🚀 Launching workflow for ${c.name} (ID: ${inserted.id})...`);
    const runResult = await campaignWorkflowService.launch(inserted, userId);
    console.log(`Workflow run started! Run ID: ${runResult.id}, Status: ${runResult.status}`);
  }

  process.exit(0);
}

run().catch(err => {
  console.error("Error launching campaigns:", err);
  process.exit(1);
});
