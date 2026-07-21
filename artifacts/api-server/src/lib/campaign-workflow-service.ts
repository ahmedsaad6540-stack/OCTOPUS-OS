import { db } from "@workspace/db";
import { campaignsTable, socialCredentialsTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { workflowEngine } from "./workflow-engine.js";
import { logger } from "./logger.js";
import type { WorkflowRun } from "@workspace/workflow-engine";

/** The canonical "Octopus Campaign Pipeline" workflow definition name */
export const CAMPAIGN_WORKFLOW_NAME = "octopus:campaign-pipeline";

/**
 * CampaignWorkflowService
 *
 * Responsible for:
 * 1. Ensuring the canonical Campaign Workflow definition exists in the DB
 *    (idempotent — creates once, re-uses afterwards).
 * 2. Triggering a workflow run for a given campaign, passing the campaign
 *    data as the workflow input so each step can reference it.
 *
 * The workflow steps are:
 *   Step 1 — "generate-script"  (task)  → generates AI script via task worker
 *   Step 2 — "render-video"    (task)  → calls HeyGen & polls until ready
 *   Step 3 — "publish-social"  (task)  → publishes to the target platform
 *   Step 4 — "campaign-done"   (event) → fires campaign.completed event
 *
 * Each step's output is injected into the next step's payload via the
 * workflow engine's template renderer (e.g. {{steps.generate-script.output.script}}).
 */
export class CampaignWorkflowService {
  private workflowId: string | null = null;

  /** Ensure the canonical workflow exists; returns its DB id. */
  async ensureWorkflow(): Promise<string> {
    if (this.workflowId) return this.workflowId;

    const existing = await workflowEngine.list({ status: "active" });
    const found = existing.find((w) => w.name === CAMPAIGN_WORKFLOW_NAME);
    if (found) {
      this.workflowId = found.id;
      return found.id;
    }

    const created = await workflowEngine.create({
      name: CAMPAIGN_WORKFLOW_NAME,
      description: "Full campaign pipeline: AI script → HeyGen render → Social publish → event",
      status: "active",
      steps: [
        {
          type: "task",
          name: "affiliate-sync",
          taskType: "campaign:affiliate-sync",
          payload: {
            campaignId: "{{input.campaignId}}",
            productId: "{{input.productId}}"
          }
        },
        {
          type: "task",
          name: "generate-script",
          taskType: "campaign:generate-script",
          payload: {
            campaignId: "{{input.campaignId}}",
            productName: "{{input.productName}}",
            platform: "{{input.platform}}",
            productUrl: "{{input.productUrl}}",
            userId: "{{input.userId}}",
          },
        },
        {
          type: "task",
          name: "generate-images",
          taskType: "campaign:generate-images",
          payload: {
            campaignId: "{{input.campaignId}}",
            script: "{{steps.generate-script.output.script}}"
          }
        },
        {
          type: "task",
          name: "render-video",
          taskType: "campaign:render-video",
          queue: "rendering",
          maxAttempts: 2,
          payload: {
            campaignId: "{{input.campaignId}}",
            userId: "{{input.userId}}",
            videoJobId: "{{steps.generate-script.output.videoJobId}}",
            script: "{{steps.generate-script.output.script}}",
            avatarId: "{{steps.generate-script.output.avatarId}}",
            voiceId: "{{steps.generate-script.output.voiceId}}",
            title: "{{steps.generate-script.output.title}}",
            platform: "{{input.platform}}",
          },
        },
        {
          type: "task",
          name: "publish-social",
          taskType: "campaign:publish-social",
          payload: {
            campaignId: "{{input.campaignId}}",
            userId: "{{input.userId}}",
            videoJobId: "{{steps.generate-script.output.videoJobId}}",
            videoUrl: "{{steps.render-video.output.videoUrl}}",
            title: "{{steps.generate-script.output.title}}",
            script: "{{steps.generate-script.output.script}}",
            platform: "{{input.platform}}",
            productUrl: "{{input.productUrl}}",
          },
        },
        {
          type: "task",
          name: "analytics-sync",
          taskType: "campaign:analytics-sync",
          payload: {
            campaignId: "{{input.campaignId}}"
          }
        },
        {
          type: "task",
          name: "cleanup",
          taskType: "campaign:cleanup",
          payload: {
            campaignId: "{{input.campaignId}}"
          }
        },
        {
          type: "event",
          name: "campaign-done",
          eventType: "campaign.completed",
          payload: {
            campaignId: "{{input.campaignId}}",
            userId: "{{input.userId}}",
            publishedUrl: "{{steps.publish-social.output.publishedUrl}}",
            platform: "{{input.platform}}",
          },
        },
      ],
    });

    logger.info({ workflowId: created.id }, "campaign_workflow.created");
    this.workflowId = created.id;
    return created.id;
  }

  /**
   * Launch the campaign workflow for a given campaign.
   * Returns the WorkflowRun (202-style async trigger).
   */
  async launch(
    campaign: {
      id: string;
      name: string;
      productName: string;
      productUrl?: string | null;
      platform?: string | null;
    },
    userId: string,
  ): Promise<WorkflowRun> {
    const workflowId = await this.ensureWorkflow();

    // Mark campaign as in-progress
    await db
      .update(campaignsTable)
      .set({
        status: "active",
        notes: "🚀 Campaign pipeline started — generating script...",
        updatedAt: new Date(),
      })
      .where(and(eq(campaignsTable.id, campaign.id), eq(campaignsTable.userId, userId)));

    const run = await workflowEngine.run(
      workflowId,
      {
        campaignId: campaign.id,
        userId,
        productName: campaign.productName,
        productUrl: campaign.productUrl ?? "",
        platform: campaign.platform ?? "youtube",
      },
      userId,
    );

    logger.info(
      { runId: run.id, campaignId: campaign.id, status: run.status },
      "campaign_workflow.launched",
    );
    return run;
  }
}

export const campaignWorkflowService = new CampaignWorkflowService();
