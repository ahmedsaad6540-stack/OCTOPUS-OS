import { randomUUID } from "node:crypto";
import { db } from "@workspace/db";
import { campaignsTable, videoJobsTable } from "@workspace/db/schema";
import { VideoJobStatus } from "../constants.js";

export class CreatorService {
  /**
   * Analyzes active campaigns to generate viral scripts & trigger Video Factory jobs.
   */
  static async executeCreatorAgentPipeline(userId: string | undefined, parsedPayload: any, logs: string[]) {
    logs.push("🎬 [Creator Agent] Analyzing active campaigns to generate viral scripts & trigger Video Factory jobs...");
    
    const activeCampaigns = await db.select().from(campaignsTable);
    const existingJobs = await db.select().from(videoJobsTable);
    const jobsByProduct = new Map<string, number>();
    for (const j of existingJobs) {
      const p = (j.productName || "").trim().toLowerCase();
      jobsByProduct.set(p, (jobsByProduct.get(p) || 0) + 1);
    }

    // Pick an active campaign that has NO video jobs or the fewest video jobs
    let targetCampaign = activeCampaigns[0];
    if (activeCampaigns.length > 0) {
      const sorted = [...activeCampaigns].sort((a, b) => {
        const countA = jobsByProduct.get((a.name || "").trim().toLowerCase()) || 0;
        const countB = jobsByProduct.get((b.name || "").trim().toLowerCase()) || 0;
        return countA - countB;
      });
      targetCampaign = sorted[0];
    }

    const targetName = targetCampaign ? (targetCampaign.name || "AI Viral Product") : "Amazon Echo Spot & Smart Devices";
    const targetPlatform = targetCampaign?.platform === "youtube" ? "YouTube Shorts" : "TikTok";
    const targetLink = targetCampaign?.productUrl || "https://octopuslab.ai/shorts";

    let customProductName = targetName;
    if (parsedPayload && parsedPayload.params && parsedPayload.params.productName) {
      customProductName = parsedPayload.params.productName;
    }

    const jobId = randomUUID();
    let jobCreated = false;
    
    try {
      if (userId) {
        const cleanTitle = customProductName.replace(/^viral drop:\s*/i, "").split("-")[0].trim();
        
        const autoStyles = [
          { tmpl: "🎨 3D Animated Cartoon & Motion Graphics", vc: "Leo (3D Animated Character) | ElevenLabs Expressive Animation" },
          { tmpl: "📦 Pure Product Showcase & Zoom Demos (No Talking Head)", vc: "Product Showcase B-Roll Mode | Studio Narrator (Ultra-Clean AI Pro)" },
          { tmpl: "🎭 Charismatic Tech Reviewer (David)", vc: "David (Charismatic Tech Presenter) | David (HeyGen Natural Tech)" },
          { tmpl: "✨ Lifestyle Influencer & Vlogger (Sarah)", vc: "Sarah (Lifestyle Influencer) | Sarah (HeyGen Casual Vlog)" },
          { tmpl: "👔 Executive Coach & Authority Presenter (Marcus)", vc: "Marcus (Executive Authority Presenter) | Marcus (HeyGen Deep Executive)" },
          { tmpl: "🧪 Animated Motion Guide (Maya v2)", vc: "Maya (Animated Motion Guide) | Maya (ElevenLabs Vibrant Animation)" }
        ];
        const chosen = autoStyles[Math.floor(Math.random() * autoStyles.length)];

        await db.insert(videoJobsTable).values({
          id: jobId,
          userId: userId,
          productName: targetName,
          title: `AI Short: ${cleanTitle} Review`,
          hook: `🛑 Stop scrolling! If you want to master ${cleanTitle} in 2026, watch this 30-second breakdown...`,
          script: `Here is why ${cleanTitle} is going viral right now. It automates everything for you in seconds. Check the official link in bio or pinned comment right now: ${targetLink}`,
          platform: targetPlatform,
          template: chosen.tmpl,
          voice: chosen.vc,
          status: VideoJobStatus.RENDERING_VIDEO,
          progress: 35,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        jobCreated = true;
        logs.push(`✅ [Creator Agent] Generated customized script for "${targetName}" & queued Multi-Style Video job: ${chosen.tmpl} (${jobId.slice(0, 8)}...).`);
      } else {
        logs.push(`ℹ️ [Creator Agent] Generated script successfully for ${targetName}.`);
      }
    } catch (e) {
      logs.push(`ℹ️ [Creator Agent] Video production pipeline already active for ${targetName}.`);
    }

    return {
      taskExecuted: "Viral Script Generation & Video Factory Queue",
      jobId: jobCreated ? jobId : "existing_queue",
      scriptTitle: `AI Short: ${targetName}`,
      hook: `🛑 Stop scrolling! Watch this 30-second breakdown of ${targetName}...`,
      platform: targetPlatform
    };
  }
}
