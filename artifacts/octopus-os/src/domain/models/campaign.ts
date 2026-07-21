export type CampaignStatus = "active" | "paused" | "draft" | "completed" | "error" | string;
export type Platform = "TikTok" | "Instagram" | "YouTube" | "Facebook" | "Pinterest" | "Twitter" | string;
export type AffiliateNetwork = "Digistore24" | "ClickBank" | "Amazon" | "Impact" | "ShareASale" | "MaxBounty" | string;

export interface Campaign {
  id: string | number;
  name: string;
  status: CampaignStatus;
  platform: Platform;
  affiliateNetwork: AffiliateNetwork;
  revenue?: number;
  roi?: number;
  posts?: number;
  productUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CampaignStats {
  clicks: number;
  sales: number;
  revenue: number;
  profit: number;
  roi: number;
  videos: number;
  posts: number;
  views: number;
  cr: string;
  epc: string;
  progress: number;
  timeline: { label: string; time: string; done: boolean }[];
}
