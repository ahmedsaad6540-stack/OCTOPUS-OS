import { randomUUID } from "node:crypto";
import type { VoiceoverInput, VoiceoverResult } from "./types.js";

export class TTSService {
  private readonly apiKey = process.env["ELEVENLABS_API_KEY"];
  private readonly defaultVoiceId = process.env["ELEVENLABS_DEFAULT_VOICE_ID"] || "21m00Tcm4TlvDq8ikWAM"; // Rachel

  async generateVoiceover(input: VoiceoverInput): Promise<VoiceoverResult> {
    const voiceId = input.voiceId || this.defaultVoiceId;
    const modelId = input.modelId || "eleven_multilingual_v2";

    if (!this.apiKey) {
      // Return clear error if API key is not provided yet in env
      return {
        audioId: randomUUID(),
        status: "failed",
        error: "ELEVENLABS_API_KEY is not configured in environment variables (.env). Please provide it to generate real voiceovers.",
      };
    }

    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: "POST",
        headers: {
          "Accept": "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": this.apiKey,
        },
        body: JSON.stringify({
          text: input.script,
          model_id: modelId,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        return {
          audioId: randomUUID(),
          status: "failed",
          error: `ElevenLabs API error (${response.status}): ${errText}`,
        };
      }

      const arrayBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");

      return {
        audioId: randomUUID(),
        audioBufferBase64: base64,
        status: "completed",
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        audioId: randomUUID(),
        status: "failed",
        error: `TTS Request failed: ${message}`,
      };
    }
  }
}
