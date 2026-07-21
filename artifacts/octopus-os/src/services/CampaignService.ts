import { Campaign, CampaignStats } from "../domain/models/campaign";
import { CampaignRepository } from "../repositories/CampaignRepository";
import { BaseService } from "./BaseService";
import { API_BASE } from "@/lib/api";

export class CampaignService extends BaseService<CampaignRepository, Campaign> {
  constructor(campaignRepo: CampaignRepository) {
    super(campaignRepo);
  }

  public async list(token: string): Promise<Campaign[]> {
    return this.repository.list(token);
  }

  public async get(token: string, id: string | number): Promise<Campaign> {
    return this.repository.get(token, id);
  }

  public async create(token: string, payload: Partial<Campaign>): Promise<Campaign> {
    return this.repository.create(token, payload);
  }

  public async activate(token: string, id: string | number): Promise<Campaign> {
    try {
      await this.repository.launchEngine(token, id);
    } catch (e) {
      // Fallback
    }
    return this.repository.update(token, id, { status: "active" });
  }

  public async pause(token: string, id: string | number): Promise<Campaign> {
    return this.repository.update(token, id, { status: "paused" });
  }

  public async archive(token: string, id: string | number): Promise<void> {
    return this.repository.delete(token, id);
  }

  public async generateVideos(token: string, id: string | number): Promise<void> {
    await this.repository.generateScripts(token, id);
  }

  public async publish(token: string): Promise<{ success: boolean; message: string }> {
    return this.repository.publish(token);
  }

  public async getCampaignStats(token: string, id: string | number): Promise<CampaignStats> {
    const res = await fetch(`${API_BASE}/campaigns/${id}/stats`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch stats: ${res.statusText}`);
    }
    
    return res.json();
  }
}
