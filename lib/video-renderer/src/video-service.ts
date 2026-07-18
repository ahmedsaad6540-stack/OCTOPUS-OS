import { randomUUID } from "node:crypto";
import type { RenderVideoInput, RenderVideoResult } from "./types.js";

export class VideoService {
  private readonly heygenApiKey = process.env["HEYGEN_API_KEY"];
  private readonly didApiKey = process.env["DID_API_KEY"];

  async renderVideo(input: RenderVideoInput): Promise<RenderVideoResult> {
    const aspectRatio = input.aspectRatio || "9:16";
    const avatarId = input.avatarId || "Abigail_expressive_2024112501"; // Default HeyGen avatar
    const voiceId = input.voiceId || "1bd001e7e50f421d891986aad5158bc8"; // Default HeyGen Arabic/Multilingual voice

    // 1. Try HeyGen API if key is provided
    if (this.heygenApiKey) {
      try {
        const response = await fetch("https://api.heygen.com/v2/video/generate", {
          method: "POST",
          headers: {
            "X-Api-Key": this.heygenApiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            video_inputs: [
              {
                character: {
                  type: "avatar",
                  avatar_id: avatarId,
                  avatar_style: "normal",
                },
                voice: {
                  type: "text",
                  input_text: input.script,
                  voice_id: voiceId,
                },
                background: input.backgroundUrl
                  ? { type: "image", url: input.backgroundUrl }
                  : { type: "color", value: "#0a0614" },
              },
            ],
            dimension: aspectRatio === "9:16" ? { width: 1080, height: 1920 } : { width: 1920, height: 1080 },
            title: input.title || `OCTOPUS Video - ${new Date().toISOString()}`,
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          return {
            videoId: randomUUID(),
            status: "failed",
            error: `HeyGen API error (${response.status}): ${errText}`,
            createdAt: new Date().toISOString(),
          };
        }

        const data = await response.json() as { data?: { video_id?: string }; error?: string };
        const videoId = data.data?.video_id || randomUUID();

        return {
          videoId,
          status: "processing",
          createdAt: new Date().toISOString(),
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          videoId: randomUUID(),
          status: "failed",
          error: `HeyGen Request failed: ${message}`,
          createdAt: new Date().toISOString(),
        };
      }
    }

    // 2. Try D-ID API if key is provided
    if (this.didApiKey) {
      try {
        const response = await fetch("https://api.d-id.com/talks", {
          method: "POST",
          headers: {
            "Authorization": `Basic ${this.didApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            script: {
              type: "text",
              input: input.script,
            },
            source_url: input.avatarUrl || "https://d-id-public-bucket.s3.us-west-2.amazonaws.com/alice.jpg",
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          return {
            videoId: randomUUID(),
            status: "failed",
            error: `D-ID API error (${response.status}): ${errText}`,
            createdAt: new Date().toISOString(),
          };
        }

        const data = await response.json() as { id?: string };
        return {
          videoId: data.id || randomUUID(),
          status: "processing",
          createdAt: new Date().toISOString(),
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          videoId: randomUUID(),
          status: "failed",
          error: `D-ID Request failed: ${message}`,
          createdAt: new Date().toISOString(),
        };
      }
    }

    // 3. Neither key provided -> clear message asking for env variables
    return {
      videoId: randomUUID(),
      status: "failed",
      error: "No video rendering API keys configured. Please add HEYGEN_API_KEY or DID_API_KEY to your Railway/.env file to generate real MP4 videos.",
      createdAt: new Date().toISOString(),
    };
  }

  async getVideoStatus(videoId: string): Promise<RenderVideoResult> {
    if (this.heygenApiKey) {
      try {
        const response = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${videoId}`, {
          headers: { "X-Api-Key": this.heygenApiKey },
        });
        if (response.ok) {
          const data = await response.json() as { data?: { status?: string; video_url?: string; error?: string } };
          const statusStr = data.data?.status?.toLowerCase();
          const status = statusStr === "completed" ? "completed" : statusStr === "failed" ? "failed" : "processing";
          return {
            videoId,
            videoUrl: data.data?.video_url,
            status,
            error: data.data?.error,
            createdAt: new Date().toISOString(),
          };
        }
      } catch {}
    }

    return {
      videoId,
      status: "processing",
      createdAt: new Date().toISOString(),
    };
  }
}
