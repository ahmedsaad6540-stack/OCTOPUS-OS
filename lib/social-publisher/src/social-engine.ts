import type {
  SocialPlatform,
  SocialPlatformAdapter,
  UnifiedPublishInput,
  UnifiedPublishResult,
  MultiPlatformPublishResult,
  SocialCredentials,
} from "./types.js";
import { FacebookPublisher } from "./facebook-publisher.js";
import { InstagramPublisher } from "./instagram-publisher.js";
import { YouTubePublisher } from "./youtube-publisher.js";
import { LinkedInPublisher } from "./linkedin-publisher.js";
import { XPublisher } from "./x-publisher.js";
import { TikTokPublisher } from "./tiktok-publisher.js";
import { UniversalGatewayAdapter } from "./universal-gateway-adapter.js";

export interface AccountTarget {
  platform: SocialPlatform;
  credentials: SocialCredentials;
  useGateway?: boolean;
}

/**
 * OCTOPUS NEXUS OS — Hybrid AI Social Engine
 * Central routing and publishing strategist for all connected platforms.
 */
export class SocialEngine {
  private adapters: Map<SocialPlatform, SocialPlatformAdapter> = new Map();

  constructor() {
    this.registerAdapter(new FacebookPublisher());
    this.registerAdapter(new InstagramPublisher());
    this.registerAdapter(new YouTubePublisher());
    this.registerAdapter(new LinkedInPublisher());
    this.registerAdapter(new XPublisher());
    this.registerAdapter(new TikTokPublisher());
  }

  registerAdapter(adapter: SocialPlatformAdapter) {
    this.adapters.set(adapter.platform, adapter);
  }

  getAdapter(platform: SocialPlatform, useGateway = false): SocialPlatformAdapter {
    if (useGateway) {
      return new UniversalGatewayAdapter(platform);
    }
    const native = this.adapters.get(platform);
    return native || new UniversalGatewayAdapter(platform);
  }

  /**
   * Tailor caption and tags for specific platform using AI strategy formatting rules
   */
  optimizeContentForPlatform(input: UnifiedPublishInput, platform: SocialPlatform): UnifiedPublishInput {
    if (!input.aiOptimize) return input;

    const baseTitle = input.title;
    const baseDesc = input.description;
    const tags = input.tags || [];

    switch (platform) {
      case "tiktok":
      case "instagram": {
        // High hook energy + 5-8 hashtags
        const hashtags = tags.slice(0, 8).map((t) => (t.startsWith("#") ? t : `#${t}`)).join(" ");
        return {
          ...input,
          title: `🔥 ${baseTitle}`.slice(0, 100),
          description: `${baseDesc}\n\n👉 Share & Follow for more!\n\n${hashtags}`.trim(),
        };
      }
      case "linkedin": {
        // Professional breakdown
        const hashtags = tags.slice(0, 4).map((t) => (t.startsWith("#") ? t : `#${t}`)).join(" ");
        return {
          ...input,
          title: baseTitle,
          description: `Key Insights on ${baseTitle}:\n\n${baseDesc}\n\n---\nWhat are your thoughts on this? Let me know in the comments below.\n\n${hashtags}`.trim(),
        };
      }
      case "x": {
        // Punchy summary < 280 characters
        const hashtags = tags.slice(0, 3).map((t) => (t.startsWith("#") ? t : `#${t}`)).join(" ");
        return {
          ...input,
          title: baseTitle,
          description: `${baseDesc.slice(0, 140)}...\n\n${hashtags}`.trim(),
        };
      }
      case "youtube": {
        // Full SEO structure
        const hashtags = tags.map((t) => (t.startsWith("#") ? t : `#${t}`)).join(" ");
        return {
          ...input,
          title: baseTitle.slice(0, 100),
          description: `${baseDesc}\n\n📌 Don't forget to Like & Subscribe!\n\n${hashtags}\n\n#OctopusOS #AI #ContentCreation`.trim(),
        };
      }
      default:
        return input;
    }
  }

  /**
   * Publish to a single platform account
   */
  async publish(
    input: UnifiedPublishInput,
    platform: SocialPlatform,
    credentials?: SocialCredentials,
    useGateway = false
  ): Promise<UnifiedPublishResult> {
    const creds = credentials || {};
    const adapter = this.getAdapter(platform, useGateway || creds.gatewayKey !== undefined);
    const optimizedInput = this.optimizeContentForPlatform(input, platform);
    return adapter.publish(optimizedInput, creds);
  }

  /**
   * Publish simultaneously across multiple accounts/platforms with AI content tailoring
   */
  async publishMulti(
    input: UnifiedPublishInput,
    targets: AccountTarget[]
  ): Promise<MultiPlatformPublishResult> {
    const results: UnifiedPublishResult[] = [];
    let successCount = 0;
    let failureCount = 0;

    await Promise.all(
      targets.map(async (target) => {
        const res = await this.publish(input, target.platform, target.credentials, target.useGateway);
        results.push(res);
        if (res.status === "completed") {
          successCount++;
        } else {
          failureCount++;
        }
      })
    );

    return {
      totalTargeted: targets.length,
      successCount,
      failureCount,
      results,
      dispatchedAt: new Date().toISOString(),
    };
  }

  /**
   * Verify status of a connected account
   */
  async verifyAccount(
    platform: SocialPlatform,
    credentials: SocialCredentials,
    useGateway = false
  ): Promise<{ connected: boolean; displayName?: string; username?: string; avatarUrl?: string; followers?: string }> {
    const adapter = this.getAdapter(platform, useGateway || credentials.gatewayKey !== undefined);
    if (adapter.verifyConnection) {
      return adapter.verifyConnection(credentials);
    }
    return { connected: credentials.accessToken !== undefined || credentials.gatewayKey !== undefined };
  }
}
