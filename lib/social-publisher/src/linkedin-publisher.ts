import { randomUUID } from "node:crypto";
import type {
  SocialPlatformAdapter,
  UnifiedPublishInput,
  UnifiedPublishResult,
  SocialCredentials,
} from "./types.js";

/**
 * LinkedIn API Adapter
 * Supports publishing articles, video links, and text updates to LinkedIn personal or company pages.
 */
export class LinkedInPublisher implements SocialPlatformAdapter {
  readonly platform = "linkedin";

  async verifyConnection(credentials: SocialCredentials): Promise<{
    connected: boolean;
    displayName?: string;
    username?: string;
    avatarUrl?: string;
  }> {
    const token = credentials.accessToken || process.env["LINKEDIN_ACCESS_TOKEN"];
    if (!token) {
      return { connected: false };
    }

    try {
      const res = await fetch("https://api.linkedin.com/v2/userinfo", {
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (!res.ok) {
        return { connected: false };
      }
      const data = await res.json() as {
        sub?: string;
        name?: string;
        picture?: string;
      };
      return {
        connected: true,
        displayName: data.name || "LinkedIn Profile",
        username: data.sub ? `li_${data.sub}` : "linkedin_user",
        avatarUrl: data.picture || "",
      };
    } catch {
      return { connected: false };
    }
  }

  async publish(input: UnifiedPublishInput, credentials?: SocialCredentials): Promise<UnifiedPublishResult> {
    const token = credentials?.accessToken || process.env["LINKEDIN_ACCESS_TOKEN"];
    const authorId = credentials?.accountId || credentials?.pageId || process.env["LINKEDIN_AUTHOR_URN"]; // e.g. "urn:li:person:12345" or "urn:li:organization:67890"

    if (!token || !authorId) {
      return {
        platform: "linkedin",
        platformId: randomUUID(),
        status: "failed",
        error: "LinkedIn access token or author URN (accountId) not provided. Please connect via OAuth.",
      };
    }

    try {
      const formattedAuthor = authorId.startsWith("urn:li:") ? authorId : `urn:li:person:${authorId}`;
      const caption = `${input.title}\n\n${input.description}\n\n${(input.tags || []).map((t) => (t.startsWith("#") ? t : `#${t}`)).join(" ")}`.trim();

      const payload: Record<string, unknown> = {
        author: formattedAuthor,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: {
              text: caption,
            },
            shareMediaCategory: input.videoUrl || input.imageUrl ? "ARTICLE" : "NONE",
            media: input.videoUrl || input.imageUrl ? [
              {
                status: "READY",
                description: { text: input.description },
                originalUrl: input.videoUrl || input.imageUrl,
                title: { text: input.title },
              }
            ] : undefined,
          },
        },
        visibility: {
          "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
        },
      };

      const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-Restli-Protocol-Version": "2.0.0",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errText = await res.text();
        return {
          platform: "linkedin",
          platformId: randomUUID(),
          status: "failed",
          error: `LinkedIn API Error (${res.status}): ${errText}`,
        };
      }

      const data = await res.json() as { id?: string };
      const postId = data.id || randomUUID();
      return {
        platform: "linkedin",
        platformId: postId,
        platformUrl: `https://www.linkedin.com/feed/update/${postId}`,
        status: "completed",
        publishedAt: new Date().toISOString(),
        aiFormattedCaption: caption,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        platform: "linkedin",
        platformId: randomUUID(),
        status: "failed",
        error: `LinkedIn Publisher Adapter Error: ${message}`,
      };
    }
  }
}
