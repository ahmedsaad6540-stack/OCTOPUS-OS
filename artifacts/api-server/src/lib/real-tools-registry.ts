import { toolManager } from "./tool-manager.js";
import { TTSService, VideoService } from "@workspace/video-renderer";
import type { RenderVideoInput, VoiceoverInput } from "@workspace/video-renderer";
import { YouTubePublisher, TikTokPublisher } from "@workspace/social-publisher";
import type { PublishVideoInput } from "@workspace/social-publisher";
import { logger } from "./logger.js";

const ttsService = new TTSService();
const videoService = new VideoService();
const youtubePublisher = new YouTubePublisher();
const tiktokPublisher = new TikTokPublisher();

export function registerRealToolHandlers(): void {
  // 1. render_video handler
  toolManager.registerHandler("render_video_handler", {
    async execute(input: unknown) {
      logger.info({ input }, "Executing real tool handler: render_video_handler");
      const typedInput = input as RenderVideoInput;
      return await videoService.renderVideo(typedInput);
    },
  });

  // 2. generate_voiceover handler
  toolManager.registerHandler("generate_voiceover_handler", {
    async execute(input: unknown) {
      logger.info({ input }, "Executing real tool handler: generate_voiceover_handler");
      const typedInput = input as VoiceoverInput;
      return await ttsService.generateVoiceover(typedInput);
    },
  });

  // 3. upload_youtube_video handler
  toolManager.registerHandler("upload_youtube_video_handler", {
    async execute(input: unknown) {
      logger.info({ input }, "Executing real tool handler: upload_youtube_video_handler");
      const typedInput = input as PublishVideoInput;
      return await youtubePublisher.publish(typedInput);
    },
  });

  // 4. upload_tiktok_video handler
  toolManager.registerHandler("upload_tiktok_video_handler", {
    async execute(input: unknown) {
      logger.info({ input }, "Executing real tool handler: upload_tiktok_video_handler");
      const typedInput = input as PublishVideoInput;
      return await tiktokPublisher.publish(typedInput);
    },
  });

  // 5. tavily_search handler
  toolManager.registerHandler("tavily_search_handler", {
    async execute(input: any) {
      logger.info({ input }, "Executing real tool handler: tavily_search_handler");
      try {
        const apiKey = process.env.TAVILY_API_KEY;
        if (!apiKey) return { error: "TAVILY_API_KEY is not set" };
        const response = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ api_key: apiKey, query: input.query, search_depth: "basic" })
        });
        return await response.json();
      } catch (err: any) {
        return { error: err.message };
      }
    },
  });

  // 6. web_scraper handler
  toolManager.registerHandler("web_scraper_handler", {
    async execute(input: any) {
      logger.info({ input }, "Executing real tool handler: web_scraper_handler");
      try {
        const response = await fetch(input.url);
        if (!response.ok) return { error: `HTTP ${response.status}` };
        const text = await response.text();
        return { content: text.substring(0, 2000) + "..." }; // mock extraction
      } catch (err: any) {
        return { error: err.message };
      }
    },
  });

  // 7. system_stats handler
  toolManager.registerHandler("system_stats_handler", {
    async execute() {
      logger.info({}, "Executing real tool handler: system_stats_handler");
      const os = await import("os");
      return {
        platform: os.platform(),
        arch: os.arch(),
        freemem: os.freemem(),
        totalmem: os.totalmem(),
        uptime: os.uptime(),
        cpus: os.cpus().length
      };
    },
  });

  logger.info("Registered real tool handlers: render_video_handler, generate_voiceover_handler, upload_youtube_video_handler, upload_tiktok_video_handler");
}

export async function ensureRealToolsRegistered(): Promise<void> {
  const toolsToSeed = [
    {
      name: "render_video",
      description: "Generates/renders an MP4 video from a script using HeyGen or D-ID AI avatars.",
      handlerName: "render_video_handler",
      inputSchema: {
        type: "object",
        properties: {
          script: { type: "string" },
          avatarId: { type: "string" },
          voiceId: { type: "string" },
          aspectRatio: { type: "string", enum: ["9:16", "16:9"] },
          title: { type: "string" },
        },
        required: ["script"],
      },
    },
    {
      name: "generate_voiceover",
      description: "Generates realistic Arabic/English voiceover audio from script using ElevenLabs.",
      handlerName: "generate_voiceover_handler",
      inputSchema: {
        type: "object",
        properties: {
          script: { type: "string" },
          voiceId: { type: "string" },
        },
        required: ["script"],
      },
    },
    {
      name: "upload_youtube_video",
      description: "Publishes a video directly to connected YouTube channel using YouTube Data API.",
      handlerName: "upload_youtube_video_handler",
      inputSchema: {
        type: "object",
        properties: {
          videoUrl: { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
        },
        required: ["title", "description"],
      },
    },
    {
      name: "upload_tiktok_video",
      description: "Publishes a video directly to connected TikTok account using TikTok Content Posting API.",
      handlerName: "upload_tiktok_video_handler",
      inputSchema: {
        type: "object",
        properties: {
          videoUrl: { type: "string" },
          title: { type: "string" },
        },
        required: ["title"],
      },
    },
    {
      name: "tavily_search",
      description: "Search the web using Tavily API.",
      handlerName: "tavily_search_handler",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string" },
        },
        required: ["query"],
      },
    },
    {
      name: "web_scraper",
      description: "Scrape content from a URL.",
      handlerName: "web_scraper_handler",
      inputSchema: {
        type: "object",
        properties: {
          url: { type: "string" },
        },
        required: ["url"],
      },
    },
    {
      name: "system_stats",
      description: "Get OS system stats (CPU, memory usage).",
      handlerName: "system_stats_handler",
      inputSchema: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  ];

  for (const toolSpec of toolsToSeed) {
    try {
      const existing = await toolManager.getByName(toolSpec.name);
      if (!existing) {
        await toolManager.create({
          name: toolSpec.name,
          description: toolSpec.description,
          handlerName: toolSpec.handlerName,
          inputSchema: toolSpec.inputSchema as any,
          status: "active",
        });
        logger.info({ toolName: toolSpec.name }, "Seeded real tool definition into DB");
      }
    } catch (err) {
      logger.error({ toolName: toolSpec.name, err }, "Failed to ensure real tool definition in DB");
    }
  }
}
