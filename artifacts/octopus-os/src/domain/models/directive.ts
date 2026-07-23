import { Platform, AffiliateNetwork } from "./campaign";

export type DirectiveCategory = "campaign" | "content" | "audience" | "monetization" | "custom";

export interface Directive {
  id: string;
  name: string;
  category: DirectiveCategory;
  systemPrompt: string;
  userDirective: string;
  platforms: Platform[];
  affiliateNetwork: AffiliateNetwork;
  tone: string;
  language: string;
  createdAt: string;
  lastUsed?: string;
  campaignCount: number;
}
