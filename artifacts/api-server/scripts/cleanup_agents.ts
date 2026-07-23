import { db } from "@workspace/db";
import { agentsTable } from "@workspace/db/schema";
import { count, asc } from "drizzle-orm";

async function run() {
  const allAgents = await db.select().from(agentsTable).orderBy(asc(agentsTable.createdAt));
  console.log("Total agents:", allAgents.length);
  
  // Keep the first 6 agents, delete the rest
  if (allAgents.length > 6) {
    const toKeep = allAgents.slice(0, 6).map(a => a.id);
    console.log("Keeping:", toKeep);
    
    // Actually, let's just delete the rest!
    for (let i = 6; i < allAgents.length; i++) {
      await db.delete(agentsTable).where(require("drizzle-orm").eq(agentsTable.id, allAgents[i].id));
    }
    console.log(`Deleted ${allAgents.length - 6} duplicate agents.`);
  }
}

run().catch(console.error).finally(() => process.exit(0));
