import { z } from "zod";

export const CampaignSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string().min(1, "Campaign name is required"),
  status: z.enum(["active", "paused", "draft", "completed", "error"]).catch("draft" as any),
  platform: z.string(),
  affiliateNetwork: z.string(),
  revenue: z.number().optional().default(0),
  roi: z.number().optional().default(0),
  posts: z.number().optional().default(0),
  productUrl: z.string().url().optional().or(z.literal("")),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
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
