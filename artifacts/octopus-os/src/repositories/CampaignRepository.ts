import { BaseRepository } from "./BaseRepository";
import { Campaign } from "../domain/models/campaign";
import { CampaignSchema } from "../domain/schemas/campaign.schema";
import { ValidationError } from "../core/Errors";
import { z } from "zod";

export class CampaignRepository extends BaseRepository<Campaign> {
  constructor() {
    super("/campaigns");
  }

  private validate(data: unknown): Campaign {
    try {
      return CampaignSchema.parse(data) as Campaign;
    } catch (err: any) {
      throw new ValidationError(`Invalid Campaign Data: ${err.message}`);
    }
  }

  async list(token: string): Promise<Campaign[]> {
    const data = await this.client.get<{ campaigns: unknown[] }>(this.basePath, { token });
    return data.campaigns.map((c: unknown) => this.validate(c));
  }

  async get(token: string, id: string | number): Promise<Campaign> {
    const data = await this.client.get<{ campaign: unknown }>(`${this.basePath}/${id}`, { token });
    return this.validate(data.campaign);
  }

  async create(token: string, data: Partial<Campaign>): Promise<Campaign> {
    const res = await this.client.post<{ campaign: unknown }>(this.basePath, data, { token });
    return this.validate(res.campaign);
  }

  async update(token: string, id: string | number, data: Partial<Campaign>): Promise<Campaign> {
    const res = await this.client.put<{ campaign: unknown }>(`${this.basePath}/${id}`, data, { token });
    return this.validate(res.campaign);
  }

  async delete(token: string, id: string | number): Promise<void> {
    await this.client.delete(`${this.basePath}/${id}`, { token });
  }

  // Engine specific actions
  async launchEngine(token: string, id: string | number): Promise<void> {
    await this.client.post(`/production/launch-campaign/${id}`, {}, { token });
  }

  async publish(token: string): Promise<{ success: boolean; message: string }> {
    const response = await this.client.post<{ summary?: string }>(`/social/publish`, {
      title: "Viral TikTok & YouTube Shorts for Affiliate Links",
      platforms: ["all"],
      aiOptimize: true,
    }, { token });
    return { success: true, message: response.summary || "تم النشر بنجاح" };
  }

  async generateScripts(token: string, id: string | number): Promise<void> {
    await this.client.post(`/autonomous/generate-scripts`, { campaignId: id }, { token });
  }
}
