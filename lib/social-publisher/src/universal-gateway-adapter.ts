import { randomUUID } from "node:crypto";
import type {
  SocialPlatformAdapter,
  UnifiedPublishInput,
  UnifiedPublishResult,
  SocialCredentials,
  SocialPlatform,
} from "./types.js";

/**
 * Universal Gateway Adapter (Postiz / Ayrshare / Buffer API)
 * Provides instant 1-click connection and unified dispatch across complex platforms
 * like TikTok, Threads, Pinterest, Telegram, WhatsApp, and Discord without requiring
 * individual app review verification for every platform on day 1.
 */
export class UniversalGatewayAdapter implements SocialPlatformAdapter {
  readonly platform: SocialPlatform;

  constructor(platform: SocialPlatform = "tiktok") {
    this.platform = platform;
  }

  async verifyConnection(credentials: SocialCredentials): Promise<{
    connected: boolean;
    displayName?: string;
    username?: string;
    avatarUrl?: string;
  }> {
    const gatewayKey = credentials.gatewayKey || credentials.accessToken || process.env["POSTIZ_API_KEY"] || process.env["AYRSHARE_API_KEY"];
    const gatewayUrl = credentials.gatewayUrl || process.env["POSTIZ_BASE_URL"] || "https://app.ayrshare.com/api";

    if (!gatewayKey) {
      return { connected: false };
    }

    try {
      const res = await fetch(`${gatewayUrl.replace(/\/$/, "")}/user`, {
        headers: { "Authorization": `Bearer ${gatewayKey}` },
      });
      if (!res.ok) {
        return { connected: false };
      }
      const data = await res.json() as {
        name?: string;
        email?: string;
        picture?: string;
      };
      return {
        connected: true,
        displayName: data.name || `${this.platform.toUpperCase()} (via Gateway)`,
        username: data.email || `gw_${this.platform}`,
        avatarUrl: data.picture || "",
      };
    } catch {
      return { connected: false };
    }
  }

  async publish(input: UnifiedPublishInput, credentials?: SocialCredentials): Promise<UnifiedPublishResult> {
    const gatewayKey = credentials?.gatewayKey || credentials?.accessToken || process.env["POSTIZ_API_KEY"] || process.env["AYRSHARE_API_KEY"];
    const gatewayUrl = credentials?.gatewayUrl || process.env["POSTIZ_BASE_URL"] || "https://app.ayrshare.com/api";

    if (!gatewayKey) {
      return {
        platform: this.platform,
        platformId: randomUUID(),
        status: "failed",
        error: `Universal Gateway API key not provided for platform (${this.platform}). Please connect via Gateway OAuth or set POSTIZ_API_KEY/AYRSHARE_API_KEY in Railway/.env.`,
      };
    }

    try {
      const caption = `${input.title}\n\n${input.description}\n\n${(input.tags || []).map((t) => (t.startsWith("#") ? t : `#${t}`)).join(" ")}`.trim();

      // Ayrshare / Postiz unified post format
      const payload: Record<string, unknown> = {
        post: caption,
        platforms: [this.platform],
        mediaUrls: input.videoUrl ? [input.videoUrl] : input.imageUrl ? [input.imageUrl] : undefined,
        scheduleDate: input.scheduledAt || undefined,
      };

      const res = await fetch(`${gatewayUrl.replace(/\/$/, "")}/post`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${gatewayKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errText = await res.text();
        return {
          platform: this.platform,
          platformId: randomUUID(),
          status: "failed",
          error: `Universal Gateway Error (${res.status}): ${errText}`,
        };
      }

      const data = await res.json() as {
        id?: string;
        postIds?: Array<{ id?: string; platform?: string; postUrl?: string }>;
      };

      const platformEntry = data.postIds?.find((p) => p.platform === this.platform) || data.postIds?.[0];
      const postId = platformEntry?.id || data.id || randomUUID();
      return {
        platform: this.platform,
        platformId: postId,
        platformUrl: platformEntry?.postUrl || `https://${this.platform}.com`,
        status: "completed",
        publishedAt: new Date().toISOString(),
        aiFormattedCaption: caption,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        platform: this.platform,
        platformId: randomUUID(),
        status: "failed",
        error: `Universal Gateway Adapter Error: ${message}`,
      };
    }
  }
}
