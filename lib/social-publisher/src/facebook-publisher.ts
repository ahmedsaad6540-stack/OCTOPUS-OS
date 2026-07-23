import { randomUUID } from "node:crypto";
import type {
  SocialPlatformAdapter,
  UnifiedPublishInput,
  UnifiedPublishResult,
  SocialCredentials,
} from "./types.js";

/**
 * Facebook Graph API Adapter
 * Supports publishing Videos (Reels / Watch), Photos, and Text posts to Facebook Pages.
 * Also verifies page access token and account connectivity.
 */
export class FacebookPublisher implements SocialPlatformAdapter {
  readonly platform = "facebook";

  async verifyConnection(credentials: SocialCredentials): Promise<{
    connected: boolean;
    displayName?: string;
    username?: string;
    avatarUrl?: string;
    followers?: string;
  }> {
    const token = credentials.accessToken || process.env["FACEBOOK_ACCESS_TOKEN"];
    if (!token) {
      return { connected: false };
    }

    try {
      // Get user profile or connected page info
      const res = await fetch(`https://graph.facebook.com/v21.0/me?fields=id,name,picture,followers_count&access_token=${token}`);
      if (!res.ok) {
        return { connected: false };
      }
      const data = await res.json() as {
        id?: string;
        name?: string;
        picture?: { data?: { url?: string } };
        followers_count?: number;
      };
      return {
        connected: true,
        displayName: data.name || "Facebook Page",
        username: data.id ? `fb_${data.id}` : "facebook_page",
        avatarUrl: data.picture?.data?.url || "",
        followers: String(data.followers_count || 0),
      };
    } catch {
      return { connected: false };
    }
  }

  async publish(input: UnifiedPublishInput, credentials?: SocialCredentials): Promise<UnifiedPublishResult> {
    const token = credentials?.accessToken || process.env["FACEBOOK_ACCESS_TOKEN"];
    const pageId = credentials?.pageId || credentials?.accountId || process.env["FACEBOOK_PAGE_ID"] || "me";

    if (!token) {
      return {
        platform: "facebook",
        platformId: randomUUID(),
        status: "failed",
        error: "Facebook access token not provided. Please connect your Facebook Page or set FACEBOOK_ACCESS_TOKEN in Railway/.env.",
      };
    }

    try {
      const caption = `${input.title}\n\n${input.description}\n\n${(input.tags || []).map((t) => (t.startsWith("#") ? t : `#${t}`)).join(" ")}`.trim();

      // Case 1: Video Publishing (Reels / Video Feed)
      if (input.videoUrl) {
        // Facebook Graph API supports uploading video from URL using file_url parameter
        const endpoint = `https://graph-video.facebook.com/v21.0/${pageId}/videos`;
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            access_token: token,
            file_url: input.videoUrl,
            title: input.title,
            description: caption,
            published: true,
          }),
        });

        if (!res.ok) {
          const errText = await res.text();
          return {
            platform: "facebook",
            platformId: randomUUID(),
            status: "failed",
            error: `Facebook Video Graph API Error (${res.status}): ${errText}`,
          };
        }

        const data = await res.json() as { id?: string };
        const videoId = data.id || randomUUID();
        return {
          platform: "facebook",
          platformId: videoId,
          platformUrl: `https://www.facebook.com/${pageId}/videos/${videoId}`,
          status: "completed",
          publishedAt: new Date().toISOString(),
          aiFormattedCaption: caption,
        };
      }

      // Case 2: Photo Publishing
      if (input.imageUrl) {
        const endpoint = `https://graph.facebook.com/v21.0/${pageId}/photos`;
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            access_token: token,
            url: input.imageUrl,
            caption: caption,
          }),
        });

        if (!res.ok) {
          const errText = await res.text();
          return {
            platform: "facebook",
            platformId: randomUUID(),
            status: "failed",
            error: `Facebook Photo Graph API Error (${res.status}): ${errText}`,
          };
        }

        const data = await res.json() as { id?: string; post_id?: string };
        const postId = data.post_id || data.id || randomUUID();
        return {
          platform: "facebook",
          platformId: postId,
          platformUrl: `https://www.facebook.com/${postId}`,
          status: "completed",
          publishedAt: new Date().toISOString(),
          aiFormattedCaption: caption,
        };
      }

      // Case 3: Text Post Feed
      const endpoint = `https://graph.facebook.com/v21.0/${pageId}/feed`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_token: token,
          message: caption,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        return {
          platform: "facebook",
          platformId: randomUUID(),
          status: "failed",
          error: `Facebook Feed Graph API Error (${res.status}): ${errText}`,
        };
      }

      const data = await res.json() as { id?: string };
      const postId = data.id || randomUUID();
      return {
        platform: "facebook",
        platformId: postId,
        platformUrl: `https://www.facebook.com/${postId}`,
        status: "completed",
        publishedAt: new Date().toISOString(),
        aiFormattedCaption: caption,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        platform: "facebook",
        platformId: randomUUID(),
        status: "failed",
        error: `Facebook Publisher Adapter Error: ${message}`,
      };
    }
  }
}
