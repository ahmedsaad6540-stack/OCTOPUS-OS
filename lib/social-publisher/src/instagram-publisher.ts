import { randomUUID } from "node:crypto";
import type {
  SocialPlatformAdapter,
  UnifiedPublishInput,
  UnifiedPublishResult,
  SocialCredentials,
} from "./types.js";

/**
 * Instagram Graph API Adapter
 * Supports publishing Reels (Video) and Carousel/Single Images to Instagram Business Accounts
 * connected via Facebook Pages.
 */
export class InstagramPublisher implements SocialPlatformAdapter {
  readonly platform = "instagram";

  async verifyConnection(credentials: SocialCredentials): Promise<{
    connected: boolean;
    displayName?: string;
    username?: string;
    avatarUrl?: string;
    followers?: string;
  }> {
    const token = credentials.accessToken || process.env["INSTAGRAM_ACCESS_TOKEN"] || process.env["FACEBOOK_ACCESS_TOKEN"];
    const igAccountId = credentials.accountId || process.env["INSTAGRAM_ACCOUNT_ID"];
    if (!token || !igAccountId) {
      return { connected: false };
    }

    try {
      const res = await fetch(`https://graph.facebook.com/v21.0/${igAccountId}?fields=id,username,name,profile_picture_url,followers_count&access_token=${token}`);
      if (!res.ok) {
        return { connected: false };
      }
      const data = await res.json() as {
        id?: string;
        username?: string;
        name?: string;
        profile_picture_url?: string;
        followers_count?: number;
      };
      return {
        connected: true,
        displayName: data.name || data.username || "Instagram Business",
        username: data.username ? `@${data.username}` : "ig_business",
        avatarUrl: data.profile_picture_url || "",
        followers: String(data.followers_count || 0),
      };
    } catch {
      return { connected: false };
    }
  }

  async publish(input: UnifiedPublishInput, credentials: SocialCredentials): Promise<UnifiedPublishResult> {
    const token = credentials.accessToken || process.env["INSTAGRAM_ACCESS_TOKEN"] || process.env["FACEBOOK_ACCESS_TOKEN"];
    const igAccountId = credentials.accountId || process.env["INSTAGRAM_ACCOUNT_ID"];

    if (!token || !igAccountId) {
      return {
        platform: "instagram",
        platformId: randomUUID(),
        status: "failed",
        error: "Instagram credentials (accessToken and accountId) not provided. Please connect your Instagram Business Account via OAuth or .env.",
      };
    }

    try {
      const caption = `${input.title}\n\n${input.description}\n\n${(input.tags || []).map((t) => (t.startsWith("#") ? t : `#${t}`)).join(" ")}`.trim();

      // Step 1: Create Container (Reels / Image)
      const containerEndpoint = `https://graph.facebook.com/v21.0/${igAccountId}/media`;
      const containerPayload: Record<string, unknown> = {
        access_token: token,
        caption: caption,
      };

      if (input.videoUrl) {
        containerPayload.media_type = "REELS";
        containerPayload.video_url = input.videoUrl;
        containerPayload.share_to_feed = true;
      } else if (input.imageUrl) {
        containerPayload.image_url = input.imageUrl;
      } else {
        return {
          platform: "instagram",
          platformId: randomUUID(),
          status: "failed",
          error: "Instagram requires either videoUrl (Reels) or imageUrl (Photo). Text-only posts are not supported.",
        };
      }

      const initRes = await fetch(containerEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(containerPayload),
      });

      if (!initRes.ok) {
        const errText = await initRes.text();
        return {
          platform: "instagram",
          platformId: randomUUID(),
          status: "failed",
          error: `Instagram Media Container Init Error (${initRes.status}): ${errText}`,
        };
      }

      const containerData = await initRes.json() as { id?: string };
      const creationId = containerData.id;
      if (!creationId) {
        return {
          platform: "instagram",
          platformId: randomUUID(),
          status: "failed",
          error: "Did not receive creation ID from Instagram Container Init.",
        };
      }

      // Step 2: Poll container status or wait briefly if it's a reel
      if (input.videoUrl) {
        for (let i = 0; i < 6; i++) {
          await new Promise((r) => setTimeout(r, 4000));
          const statusRes = await fetch(`https://graph.facebook.com/v21.0/${creationId}?fields=status_code&access_token=${token}`);
          if (statusRes.ok) {
            const statusData = await statusRes.json() as { status_code?: string };
            if (statusData.status_code === "FINISHED") break;
            if (statusData.status_code === "ERROR") {
              return {
                platform: "instagram",
                platformId: creationId,
                status: "failed",
                error: "Instagram Reels container processing failed on Meta servers.",
              };
            }
          }
        }
      }

      // Step 3: Publish Media Container
      const publishEndpoint = `https://graph.facebook.com/v21.0/${igAccountId}/media_publish`;
      const publishRes = await fetch(publishEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_token: token,
          creation_id: creationId,
        }),
      });

      if (!publishRes.ok) {
        const errText = await publishRes.text();
        return {
          platform: "instagram",
          platformId: creationId,
          status: "failed",
          error: `Instagram Media Publish Error (${publishRes.status}): ${errText}`,
        };
      }

      const publishData = await publishRes.json() as { id?: string };
      const publishedId = publishData.id || creationId;
      return {
        platform: "instagram",
        platformId: publishedId,
        platformUrl: `https://www.instagram.com/p/${publishedId}`,
        status: "completed",
        publishedAt: new Date().toISOString(),
        aiFormattedCaption: caption,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        platform: "instagram",
        platformId: randomUUID(),
        status: "failed",
        error: `Instagram Publisher Adapter Error: ${message}`,
      };
    }
  }
}
