import { z } from "zod";

export const CampaignSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string().min(1, "Campaign name is required"),
  status: z.enum(["active", "paused", "draft", "completed", "error", "running", "failed"]).catch("draft" as any),
  platform: z.string().nullable().catch("tiktok"),
  affiliateNetwork: z.string().nullable().catch(""),
  revenue: z.number().nullable().catch(0),
  roi: z.number().nullable().catch(0),
  posts: z.number().nullable().catch(0),
  productUrl: z.string().url().nullable().or(z.literal("")).catch(""),
  createdAt: z.string().nullable().catch(""),
  updatedAt: z.string().nullable().catch(""),
});

export const CampaignStatsSchema = z.object({
  clicks: z.number(),
  sales: z.number(),
  revenue: z.number(),
  profit: z.number(),
  roi: z.number(),
  videos: z.number(),
  posts: z.number(),
  views: z.number(),
  cr: z.string(),
  epc: z.string(),
  progress: z.number(),
  timeline: z.array(z.object({
    label: z.string(),
    time: z.string(),
    done: z.boolean(),
  })),
});
