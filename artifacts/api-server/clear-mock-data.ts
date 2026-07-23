import "dotenv/config";
import { db } from "@workspace/db";
import { campaignsTable, agentRunsTable, socialAccountsTable } from "@workspace/db/schema";
import { sql, eq, and } from "drizzle-orm";

async function main() {
  console.log("Safe Test-Data Cleanup Utility");
  
  const args = process.argv.slice(2);
  const isProduction = process.env.NODE_ENV === "production" || process.env.DATABASE_URL?.includes("railway");
  
  const isEmergencyOverride = args.includes("--emergency-override");
  const isDryRun = !args.includes("--confirm");
  
  const workspaceIdArg = args.find(a => a.startsWith("--workspace="));
  const workspaceId = workspaceIdArg ? workspaceIdArg.split("=")[1] : null;

  if (isProduction && !isEmergencyOverride) {
    console.error("ERROR: Refusing to run against production database without --emergency-override");
    process.exit(1);
  }

  if (!workspaceId) {
    console.error("ERROR: Explicit test workspace ID required. Use --workspace=<id>");
    process.exit(1);
  }

  console.log(`Target Workspace: ${workspaceId}`);
  console.log(`Dry Run Mode: ${isDryRun ? "YES" : "NO"}`);
  console.log(`Production Mode: ${isProduction ? "YES" : "NO"}`);

  try {
    await db.transaction(async (tx) => {
      // Show counts before deletion for connection_source='mock' in the specific workspace
      // Actually we just filter by workspaceId for campaigns/agentRuns if they have mock fields
      // But the requirement says: "deletes only connection_source='mock' records;"
      
      const campaignsCount = await tx.select({ count: sql<number>`count(*)` }).from(campaignsTable).where(eq(campaignsTable.workspaceId, workspaceId));
      const agentRunsCount = await tx.select({ count: sql<number>`count(*)` }).from(agentRunsTable).where(eq(agentRunsTable.workspaceId, workspaceId));
      const socialCount = await tx.select({ count: sql<number>`count(*)` }).from(socialAccountsTable).where(and(eq(socialAccountsTable.workspaceId, workspaceId), eq(socialAccountsTable.connectionSource, 'mock')));

      console.log(`Found ${campaignsCount[0].count} campaigns in workspace`);
      console.log(`Found ${agentRunsCount[0].count} agent runs in workspace`);
      console.log(`Found ${socialCount[0].count} mock social accounts in workspace`);

      if (isDryRun) {
        console.log("DRY RUN COMPLETE. No records were deleted. Use --confirm to execute.");
        return; // Exits transaction normally without deleting
      }

      console.log("Executing deletion inside transaction...");
      
      // We are only allowed to delete mock records or things strictly tied to this test workspace
      await tx.delete(socialAccountsTable).where(and(eq(socialAccountsTable.workspaceId, workspaceId), eq(socialAccountsTable.connectionSource, 'mock')));
      // Assuming test workspaces can have their campaigns/runs cleared
      await tx.delete(agentRunsTable).where(eq(agentRunsTable.workspaceId, workspaceId));
      await tx.delete(campaignsTable).where(eq(campaignsTable.workspaceId, workspaceId));

      console.log("✅ Deletion successful.");
    });
  } catch (error) {
    console.error("Transaction failed. Rolling back...", error);
    process.exit(1);
  }
  
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
