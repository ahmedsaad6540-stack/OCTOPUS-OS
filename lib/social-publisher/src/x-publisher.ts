import { randomUUID } from "node:crypto";
import type {
  SocialPlatformAdapter,
  UnifiedPublishInput,
  UnifiedPublishResult,
  SocialCredentials,
} from "./types.js";

/**
 * X (Twitter) API v2 Adapter
 * Supports publishing Tweets (Text and URL links to media) via OAuth 2.0 Bearer tokens.
 */
export class XPublisher implements SocialPlatformAdapter {
  readonly platform = "x";

  async verifyConnection(credentials: SocialCredentials): Promise<{
    connected: boolean;
    displayName?: string;
    username?: string;
    avatarUrl?: string;
  }> {
    const token = credentials.accessToken || process.env["X_ACCESS_TOKEN"] || process.env["TWITTER_ACCESS_TOKEN"];
    if (!token) {
      return { connected: false };
    }

    try {
      const res = await fetch("https://api.twitter.com/2/users/me?user.fields=profile_image_url,username,name", {
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (!res.ok) {
        return { connected: false };
      }
      const data = await res.json() as {
        data?: {
          id?: string;
          name?: string;
          username?: string;
          profile_image_url?: string;
        };
      };
      return {
        connected: true,
        displayName: data.data?.name || "X Profile",
        username: data.data?.username ? `@${data.data?.username}` : "x_user",
        avatarUrl: data.data?.profile_image_url || "",
      };
    } catch {
      return { connected: false };
    }
  }

  async publish(input: UnifiedPublishInput, credentials: SocialCredentials): Promise<UnifiedPublishResult> {
    const token = credentials.accessToken || process.env["X_ACCESS_TOKEN"] || process.env["TWITTER_ACCESS_TOKEN"];

    if (!token) {
      return {
        platform: "x",
        platformId: randomUUID(),
        status: "failed",
        error: "X/Twitter access token not provided. Please connect via OAuth 2.0.",
      };
    }

    try {
      // X Tweets have a 280 character limit for regular users; AI formatted captions should be concise
      const hashtags = (input.tags || []).slice(0, 3).map((t) => (t.startsWith("#") ? t : `#${t}`)).join(" ");
      let tweetText = `${input.title}\n\n${input.description}\n\n${hashtags}`.trim();
      if (input.videoUrl || input.imageUrl) {
        tweetText += `\n\n${input.videoUrl || input.imageUrl}`;
      }

      if (tweetText.length > 280) {
        // Truncate cleanly around 250 to keep room for URL/hashtags
        tweetText = `${input.title}\n${input.description.slice(0, 150)}...\n${hashtags}`.trim();
        if (input.videoUrl || input.imageUrl) {
          tweetText = `${tweetText}\n${input.videoUrl || input.imageUrl}`.slice(0, 280);
        }
      }

      const res = await fetch("https://api.twitter.com/2/tweets", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: tweetText,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        return {
          platform: "x",
          platformId: randomUUID(),
          status: "failed",
          error: `X/Twitter v2 API Error (${res.status}): ${errText}`,
        };
      }

      const data = await res.json() as { data?: { id?: string } };
      const tweetId = data.data?.id || randomUUID();
      return {
        platform: "x",
        platformId: tweetId,
        platformUrl: `https://x.com/i/status/${tweetId}`,
        status: "completed",
        publishedAt: new Date().toISOString(),
        aiFormattedCaption: tweetText,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        platform: "x",
        platformId: randomUUID(),
        status: "failed",
        error: `X Publisher Adapter Error: ${message}`,
      };
    }
  }
}
