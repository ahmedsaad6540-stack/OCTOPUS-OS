import { randomUUID } from "node:crypto";
import type {
  SocialPlatformAdapter,
  PublishVideoInput,
  PublishVideoResult,
  UnifiedPublishInput,
  UnifiedPublishResult,
  SocialCredentials,
} from "./types.js";

export class YouTubePublisher implements SocialPlatformAdapter {
  readonly platform = "youtube";

  private readonly clientId = process.env["YOUTUBE_CLIENT_ID"];
  private readonly clientSecret = process.env["YOUTUBE_CLIENT_SECRET"];
  private readonly envRefreshToken = process.env["YOUTUBE_REFRESH_TOKEN"];
  private readonly accessToken = process.env["YOUTUBE_ACCESS_TOKEN"];

  private async getAccessToken(credentials?: SocialCredentials): Promise<string | null> {
    if (credentials?.accessToken) return credentials.accessToken;
    const refToken = credentials?.refreshToken || this.envRefreshToken;
    if (this.clientId && this.clientSecret && refToken) {
      try {
        const response = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: this.clientId,
            client_secret: this.clientSecret,
            refresh_token: refToken,
            grant_type: "refresh_token",
          }),
        });

        if (response.ok) {
          const data = await response.json() as { access_token?: string };
          if (data.access_token) {
            process.env["YOUTUBE_ACCESS_TOKEN"] = data.access_token;
            return data.access_token;
          }
        }
      } catch {}
    }
    return this.accessToken || null;
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
      const res = await fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true", {
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (!res.ok) return { connected: false };
      const data = await res.json() as {
        items?: Array<{
          snippet?: { title?: string; customUrl?: string; thumbnails?: { default?: { url?: string } } };
          statistics?: { subscriberCount?: string };
        }>;
      };
      const channel = data.items?.[0];
      if (!channel) return { connected: false };
      return {
        connected: true,
        displayName: channel.snippet?.title || "YouTube Channel",
        username: channel.snippet?.customUrl || "youtube_channel",
        avatarUrl: channel.snippet?.thumbnails?.default?.url || "",
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

  async publish(input: UnifiedPublishInput, credentials: SocialCredentials): Promise<UnifiedPublishResult> {
    const token = await this.getAccessToken(credentials);
    if (!token) {
      return {
        platform: "youtube",
        platformId: randomUUID(),
        status: "failed",
        error: "YouTube credentials not found. Please connect your YouTube account via OAuth or set YOUTUBE_REFRESH_TOKEN in Railway/.env.",
      };
    }

    if (!input.videoUrl && !input.videoPath) {
      return {
        platform: "youtube",
        platformId: randomUUID(),
        status: "failed",
        error: "Either videoUrl or videoPath is required to publish to YouTube.",
      };
    }

    try {
      let videoBuffer: ArrayBuffer;
      if (input.videoUrl) {
        const vidResp = await fetch(input.videoUrl);
        if (!vidResp.ok) {
          return {
            platform: "youtube",
            platformId: randomUUID(),
            status: "failed",
            error: `Failed to fetch video file from URL: ${vidResp.statusText}`,
          };
        }
        videoBuffer = await vidResp.arrayBuffer();
      } else {
        return {
          platform: "youtube",
          platformId: randomUUID(),
          status: "failed",
          error: "Local videoPath upload requires filesystem streaming support. Please pass videoUrl from renderer.",
        };
      }

      const caption = `${input.description}\n\n${(input.tags || []).map((t) => (t.startsWith("#") ? t : `#${t}`)).join(" ")}`.trim();
      const metadata = {
        snippet: {
          title: input.title.slice(0, 100), // YouTube title limit is 100
          description: caption,
          tags: input.tags || [],
          categoryId: "22", // People & Blogs
        },
        status: {
          privacyStatus: input.privacyStatus || "public",
          selfDeclaredMadeForKids: false,
        },
      };

      const initResponse = await fetch("https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json; charset=UTF-8",
          "X-Upload-Content-Length": String(videoBuffer.byteLength),
          "X-Upload-Content-Type": "video/mp4",
        },
        body: JSON.stringify(metadata),
      });

      if (!initResponse.ok) {
        const errText = await initResponse.text();
        return {
          platform: "youtube",
          platformId: randomUUID(),
          status: "failed",
          error: `YouTube Resumable Init failed (${initResponse.status}): ${errText}`,
        };
      }

      const uploadUrl = initResponse.headers.get("Location");
      if (!uploadUrl) {
        return {
          platform: "youtube",
          platformId: randomUUID(),
          status: "failed",
          error: "YouTube did not return upload URL Location header.",
        };
      }

      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": "video/mp4" },
        body: videoBuffer,
      });

      if (!uploadResponse.ok) {
        const errText = await uploadResponse.text();
        return {
          platform: "youtube",
          platformId: randomUUID(),
          status: "failed",
          error: `YouTube Video Bytes Upload failed (${uploadResponse.status}): ${errText}`,
        };
      }

      const uploadData = await uploadResponse.json() as { id?: string };
      const videoId = uploadData.id || randomUUID();

      return {
        platform: "youtube",
        platformId: videoId,
        platformUrl: `https://www.youtube.com/watch?v=${videoId}`,
        status: "completed",
        publishedAt: new Date().toISOString(),
        aiFormattedCaption: caption,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        platform: "youtube",
        platformId: randomUUID(),
        status: "failed",
        error: `YouTube Publisher Error: ${message}`,
      };
    }
  }
}
