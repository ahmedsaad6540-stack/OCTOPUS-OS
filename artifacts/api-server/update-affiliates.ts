import "dotenv/config";
import { db } from "@workspace/db";
import { campaignsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  console.log("Updating campaigns affiliate network to Digistore24...");
  
  const campaigns = await db.select().from(campaignsTable);
  
  for (const c of campaigns) {
    let url = c.productUrl || "https://www.digistore24.com";
    
    // Ensure it uses their affiliate token "octopuslabai4418"
    if (url.includes("aff=")) {
      url = url.replace(/aff=[^&]+/, "aff=octopuslabai4418");
    } else if (url.includes("#")) {
      url = url.replace(/#.*/, "#aff=octopuslabai4418");
    } else {
      url = `${url}#aff=octopuslabai4418`;
    }

    await db.update(campaignsTable)
      .set({
        affiliateNetwork: "digistore24",
        productUrl: url,
        updatedAt: new Date()
      })
      .where(eq(campaignsTable.id, c.id));
  }
  
  console.log("✅ Successfully updated all campaigns to Digistore24 with affiliate ID: octopuslabai4418");
  process.exit(0);
}

main().catch((err) => {
  console.error("Failed to update campaigns:", err);
  process.exit(1);
});
