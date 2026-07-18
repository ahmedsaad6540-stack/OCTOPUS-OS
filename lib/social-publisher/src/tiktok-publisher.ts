import { randomUUID } from "node:crypto";
import type {
  SocialPlatformAdapter,
  PublishVideoInput,
  PublishVideoResult,
  UnifiedPublishInput,
  UnifiedPublishResult,
  SocialCredentials,
} from "./types.js";

export class TikTokPublisher implements SocialPlatformAdapter {
  readonly platform = "tiktok";

  private readonly clientKey = process.env["TIKTOK_CLIENT_KEY"];
  private readonly clientSecret = process.env["TIKTOK_CLIENT_SECRET"];
  private accessToken = process.env["TIKTOK_ACCESS_TOKEN"];

  private async getAccessToken(credentials?: SocialCredentials): Promise<string | null> {
    if (credentials?.accessToken) return credentials.accessToken;
    if (this.accessToken) return this.accessToken;
    if (!this.clientKey || !this.clientSecret) return null;

    try {
      const response = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_key: this.clientKey,
          client_secret: this.clientSecret,
          grant_type: "client_credentials",
        }),
      });

      if (!response.ok) return null;
      const data = await response.json() as { access_token?: string };
      if (data.access_token) {
        this.accessToken = data.access_token;
        return data.access_token;
      }
      return null;
    } catch {
      return null;
    }
  }

  async verifyConnection(credentials: SocialCredentials): Promise<{
    connected: boolean;
    displayName?: string;
    username?: string;
    avatarUrl?: string;
  }> {
    const token = await this.getAccessToken(credentials);
    if (!token) return { connected: false };

    try {
      const res = await fetch("https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name", {
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (!res.ok) return { connected: false };
      const data = await res.json() as {
        data?: {
          user?: { display_name?: string; avatar_url?: string; open_id?: string };
        };
      };
      const user = data.data?.user;
      if (!user) return { connected: false };
      return {
        connected: true,
        displayName: user.display_name || "TikTok Creator",
        username: user.open_id ? `tk_${user.open_id.slice(0, 8)}` : "tiktok_creator",
        avatarUrl: user.avatar_url || "",
      };
    } catch {
      return { connected: false };
    }
  }

  // Backward compatibility method
  async publishVideo(input: PublishVideoInput): Promise<PublishVideoResult> {
    const res = await this.publish({
      title: input.title,
      description: input.description,
      videoUrl: input.videoUrl,
      videoPath: input.videoPath,
      tags: input.tags,
      privacyStatus: input.privacyStatus,
    }, {});
    return {
      platformVideoId: res.platformId,
      platformVideoUrl: res.platformUrl,
      status: res.status,
      error: res.error,
      publishedAt: res.publishedAt,
    };
  }

  async publish(input: UnifiedPublishInput, credentials?: SocialCredentials): Promise<UnifiedPublishResult> {
    const token = await this.getAccessToken(credentials);
    if (!token) {
      return {
        platform: "tiktok",
        platformId: randomUUID(),
        status: "failed",
        error: "TikTok API credentials not found. Please connect your TikTok account via OAuth or set TIKTOK_ACCESS_TOKEN.",
      };
    }

    if (!input.videoUrl && !input.videoPath) {
      return {
        platform: "tiktok",
        platformId: randomUUID(),
        status: "failed",
        error: "Either videoUrl or videoPath is required to publish to TikTok.",
      };
    }

    try {
      const caption = `${input.title}\n\n${input.description}\n\n${(input.tags || []).map((t) => (t.startsWith("#") ? t : `#${t}`)).join(" ")}`.trim();

      const initResponse = await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json; charset=UTF-8",
        },
        body: JSON.stringify({
          post_info: {
            title: caption.slice(0, 150),
            privacy_level: input.privacyStatus === "private" ? "SELF_ONLY" : "PUBLIC_TO_EVERYONE",
            disable_duet: false,
            disable_comment: false,
            disable_stitch: false,
            video_cover_timestamp_ms: 1000,
          },
          source_info: {
            source: "PULL_FROM_URL",
            video_url: input.videoUrl,
          },
        }),
      });

      if (!initResponse.ok) {
        const errText = await initResponse.text();
        return {
          platform: "tiktok",
          platformId: randomUUID(),
          status: "failed",
          error: `TikTok Post Init failed (${initResponse.status}): ${errText}`,
        };
      }

      const data = await initResponse.json() as { data?: { publish_id?: string }; error?: { message?: string } };
      if (data.error?.message) {
        return {
          platform: "tiktok",
          platformId: randomUUID(),
          status: "failed",
          error: `TikTok API Error: ${data.error.message}`,
        };
      }

      const publishId = data.data?.publish_id || randomUUID();
      return {
        platform: "tiktok",
        platformId: publishId,
        platformUrl: `https://www.tiktok.com/@creator/video/${publishId}`,
        status: "completed",
        publishedAt: new Date().toISOString(),
        aiFormattedCaption: caption,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        platform: "tiktok",
        platformId: randomUUID(),
        status: "failed",
        error: `TikTok Publisher Error: ${message}`,
      };
    }
  }
}
