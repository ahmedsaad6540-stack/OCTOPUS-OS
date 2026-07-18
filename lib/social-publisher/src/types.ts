export type SocialPlatform =
  | "facebook"
  | "instagram"
  | "youtube"
  | "linkedin"
  | "x"
  | "tiktok"
  | "pinterest"
  | "threads"
  | "telegram"
  | "whatsapp"
  | "discord"
  | "slack"
  | "reddit";

export interface SocialCredentials {
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: Date | string | number;
  apiKey?: string;
  apiSecret?: string;
  accountId?: string;
  pageId?: string;
  gatewayKey?: string;
  gatewayUrl?: string;
}

export interface PublishVideoInput {
  videoUrl?: string;
  videoPath?: string;
  title: string;
  description: string;
  tags?: string[];
  privacyStatus?: "public" | "unlisted" | "private";
}

export interface PublishVideoResult {
  platformVideoId: string;
  platformVideoUrl?: string;
  status: "completed" | "failed";
  error?: string;
  publishedAt?: string;
}

export interface UnifiedPublishInput {
  title: string;
  description: string;
  videoUrl?: string;
  videoPath?: string;
  imageUrl?: string;
  tags?: string[];
  privacyStatus?: "public" | "unlisted" | "private";
  targetPlatforms?: SocialPlatform[];
  scheduledAt?: string;
  aiOptimize?: boolean; // If true, SocialEngine auto-tailors hook/caption per platform
  metadata?: Record<string, unknown>;
}

export interface UnifiedPublishResult {
  platform: SocialPlatform;
  platformId: string;
  platformUrl?: string;
  status: "completed" | "failed";
  error?: string;
  publishedAt?: string;
  aiFormattedCaption?: string;
}

export interface MultiPlatformPublishResult {
  totalTargeted: number;
  successCount: number;
  failureCount: number;
  results: UnifiedPublishResult[];
  dispatchedAt: string;
}

export interface SocialPlatformAdapter {
  readonly platform: SocialPlatform;
  publish(input: UnifiedPublishInput, credentials: SocialCredentials): Promise<UnifiedPublishResult>;
  refreshToken?(credentials: SocialCredentials): Promise<SocialCredentials | null>;
  verifyConnection?(credentials: SocialCredentials): Promise<{
    connected: boolean;
    displayName?: string;
    username?: string;
    avatarUrl?: string;
    followers?: string;
  }>;
}
