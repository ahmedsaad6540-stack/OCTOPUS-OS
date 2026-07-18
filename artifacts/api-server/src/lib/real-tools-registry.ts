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
