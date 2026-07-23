import { aiProviderManager } from "../../lib/ai-provider-manager.js";
import { db } from "@workspace/db";
import { randomUUID } from "node:crypto";

export interface VideoScriptRequest {
  topic: string;
  targetDurationSeconds: number;
  providerConfigId?: string; // If not provided, uses default
}

export interface VideoScriptResponse {
  title: string;
  hook: string;
  body: string[];
  callToAction: string;
}

export interface VideoGenerationJob {
  jobId: string;
  status: "pending" | "script_generated" | "audio_generated" | "rendering" | "completed" | "failed";
  progress: number;
  outputUrl?: string;
  error?: string;
}

export class VideoEngine {
  async generateScript(req: VideoScriptRequest): Promise<VideoScriptResponse> {
    const prompt = `Write a viral short-form video script about: ${req.topic}. 
    Duration: ${req.targetDurationSeconds} seconds.
    Format as JSON with keys: title, hook, body (array of strings), callToAction.`;

    const requestObj = {
      messages: [{ role: "user" as const, content: prompt }],
      responseFormat: "json_object" as const,
      maxTokens: 500,
    };

    let response;
    if (req.providerConfigId) {
      response = await aiProviderManager.complete(req.providerConfigId, requestObj);
    } else {
      response = await aiProviderManager.completeWithDefault(requestObj);
    }

    try {
      return JSON.parse(response.content) as VideoScriptResponse;
    } catch (e) {
      // Fallback for providers that didn't strictly respect JSON (e.g. Anthropic without tools)
      return {
        title: "Generated Video",
        hook: "Let's dive in!",
        body: [response.content],
        callToAction: "Link in bio!"
      };
    }
  }

  async generateStoryboardImages(script: VideoScriptResponse, count: number): Promise<string[]> {
    // Generate images based on script body
    const images: string[] = [];
    for (let i = 0; i < Math.min(count, script.body.length); i++) {
      try {
        const res = await aiProviderManager.generateImageWithDefault({
          prompt: `A cinematic engaging visual for a short video. Concept: ${script.body[i]}`,
          size: "1024x1792" // Vertical for shorts
        });
        if (res.data && res.data[0]) {
          images.push(res.data[0].url);
        }
      } catch (e) {
        console.error("Failed to generate image:", e);
      }
    }
    return images;
  }

  async renderVideo(script: VideoScriptResponse, images: string[]): Promise<string> {
    const heygenKey = process.env["HEYGEN_API_KEY"];
    if (!heygenKey) {
      throw new Error("HEYGEN_API_KEY is missing. Cannot render real AI video.");
    }

    const fullScript = `${script.hook} ${script.body.join(" ")} ${script.callToAction}`;

    // Real HeyGen render
    const initRes = await fetch("https://api.heygen.com/v2/video/generate", {
      method: "POST",
      headers: { "X-Api-Key": heygenKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        video_inputs: [{
          character: { type: "avatar", avatar_id: "Aditya_public_4", avatar_style: "normal" },
          voice: { type: "text", input_text: fullScript, voice_id: "f38a635bee7a4d1f9b0a654a31d050d2" },
          background: { type: "color", value: "#0a0614" },
        }],
        dimension: { width: 1080, height: 1920 },
        title: script.title || "OCTOPUS Generated Video",
      }),
    });

    if (!initRes.ok) {
      throw new Error(`HeyGen init failed (${initRes.status}): ${await initRes.text()}`);
    }

    const initData = await initRes.json() as { data?: { video_id?: string } };
    const heygenVideoId = initData.data?.video_id;
    if (!heygenVideoId) throw new Error("HeyGen did not return video_id");

    // Poll HeyGen until ready
    const HEYGEN_MAX_POLLS = 50;
    const HEYGEN_POLL_INTERVAL_MS = 9000;
    
    let videoUrl: string | null = null;
    for (let i = 0; i < HEYGEN_MAX_POLLS; i++) {
      await new Promise((r) => setTimeout(r, HEYGEN_POLL_INTERVAL_MS));

      const stRes = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${heygenVideoId}`, {
        headers: { "X-Api-Key": heygenKey },
      });
      if (!stRes.ok) continue;

      const stData = await stRes.json() as { data?: { status?: string; video_url?: string } };
      const st = stData.data?.status?.toLowerCase();

      if (st === "completed" && stData.data?.video_url) {
        videoUrl = stData.data.video_url;
        break;
      }
      if (st === "failed") throw new Error(`HeyGen render failed for video_id=${heygenVideoId}`);
    }

    if (!videoUrl) throw new Error("Timed out waiting for HeyGen render");
    return videoUrl;
  }

  async queueVideoGeneration(req: VideoScriptRequest): Promise<VideoGenerationJob> {
    // In a real system, this pushes to a background worker
    // For now, we simulate a synchronous or mocked asynchronous pipeline
    const jobId = randomUUID();
    return {
      jobId,
      status: "pending",
      progress: 0
    };
  }
}

export const videoEngine = new VideoEngine();
