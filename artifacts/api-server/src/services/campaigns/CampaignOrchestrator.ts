import { db } from "@workspace/db";
import { campaignsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { videoEngine } from "../video/VideoEngine.js";

export type CampaignState = 
  | "draft" 
  | "planning" 
  | "generating_script" 
  | "generating_media" 
  | "rendering_video" 
  | "ready_for_review" 
  | "publishing" 
  | "published" 
  | "failed";

export class CampaignOrchestrator {
  
  async transitionState(campaignId: string, newState: CampaignState, metaUpdate?: any) {
    const [updated] = await db
      .update(campaignsTable)
      .set({ 
        status: newState, 
        ...(metaUpdate ? { metadata: metaUpdate } : {}),
        updatedAt: new Date()
      })
      .where(eq(campaignsTable.id, campaignId))
      .returning();
      
    if (!updated) {
      throw new Error(`Campaign ${campaignId} not found`);
    }

    // Trigger state-specific handlers (Event-driven queue in production)
    this.handleStateTransition(updated, newState);
    return updated;
  }

  private async handleStateTransition(campaign: any, state: CampaignState) {
    try {
      switch (state) {
        case "generating_script":
          // async trigger
          this.executeScriptGeneration(campaign);
          break;
        case "generating_media":
          this.executeMediaGeneration(campaign);
          break;
        case "rendering_video":
          this.executeRendering(campaign);
          break;
      }
    } catch (e) {
      console.error(`Error in state ${state} for campaign ${campaign.id}:`, e);
      await this.transitionState(campaign.id, "failed", { error: (e as Error).message });
    }
  }

  private async executeScriptGeneration(campaign: any) {
    try {
      const topic = campaign.name || "Affiliate product promotion";
      const script = await videoEngine.generateScript({ topic, targetDurationSeconds: 45 });
      
      const meta = campaign.metadata || {};
      meta.script = script;
      
      await this.transitionState(campaign.id, "generating_media", meta);
    } catch (e) {
      await this.transitionState(campaign.id, "failed", { error: "Script generation failed" });
    }
  }

  private async executeMediaGeneration(campaign: any) {
    try {
      const script = campaign.metadata?.script;
      if (!script) throw new Error("No script found");

      const images = await videoEngine.generateStoryboardImages(script, 3);
      
      const meta = campaign.metadata || {};
      meta.storyboardImages = images;
      
      await this.transitionState(campaign.id, "rendering_video", meta);
    } catch (e) {
      await this.transitionState(campaign.id, "failed", { error: "Media generation failed" });
    }
  }

  private async executeRendering(campaign: any) {
    try {
      const script = campaign.metadata?.script;
      const images = campaign.metadata?.storyboardImages || [];
      
      const videoUrl = await videoEngine.renderVideo(script, images);
      
      const meta = campaign.metadata || {};
      meta.videoUrl = videoUrl;
      
      await this.transitionState(campaign.id, "ready_for_review", meta);
    } catch (e) {
      await this.transitionState(campaign.id, "failed", { error: "Video rendering failed" });
    }
  }
}

export const campaignOrchestrator = new CampaignOrchestrator();
