export interface RenderVideoInput {
  script: string;
  avatarId?: string;
  avatarUrl?: string;
  voiceId?: string;
  aspectRatio?: "9:16" | "16:9";
  title?: string;
  backgroundUrl?: string;
}

export interface RenderVideoResult {
  videoId: string;
  videoUrl?: string;
  status: "processing" | "completed" | "failed";
  error?: string;
  createdAt: string;
}

export interface VoiceoverInput {
  script: string;
  voiceId?: string;
  modelId?: string;
}

export interface VoiceoverResult {
  audioId: string;
  audioBufferBase64?: string;
  audioUrl?: string;
  status: "completed" | "failed";
  error?: string;
}
